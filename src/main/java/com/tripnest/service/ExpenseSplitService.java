package com.tripnest.service;

import com.tripnest.dto.*;
import com.tripnest.entity.Expense;
import com.tripnest.entity.ShareStatus;
import com.tripnest.entity.TravelGroup;
import com.tripnest.entity.Trip;
import com.tripnest.entity.TripShare;
import com.tripnest.entity.User;
import com.tripnest.exception.BadRequestException;
import com.tripnest.exception.ResourceNotFoundException;
import com.tripnest.exception.UnauthorizedAccessException;
import com.tripnest.model.ExpenseSplit;
import com.tripnest.model.Settlement;
import com.tripnest.model.SettlementStatus;
import com.tripnest.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ExpenseSplitService {

    @Autowired
    private ExpenseSplitRepository expenseSplitRepository;

    @Autowired
    private SettlementRepository settlementRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TripShareRepository tripShareRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private TripShareService tripShareService;

    @Transactional
    public List<ExpenseSplit> splitExpense(Expense expense, List<Long> splitUserIds, Long payerId) {
        if (expense == null || expense.getId() == null) {
            throw new BadRequestException("Expense must be persisted before splitting");
        }

        if (expense.getTrip() == null || expense.getTrip().getId() == null) {
            throw new BadRequestException("Expense is not associated with any trip");
        }

        Long tripId = expense.getTrip().getId();
        List<User> activeTripUsers = getActiveTripUsers(tripId);
        Map<Long, User> activeUserMap = activeTripUsers.stream()
                .filter(u -> u.getId() != null)
                .collect(Collectors.toMap(User::getId, u -> u, (a, b) -> a));

        if (payerId != null && !activeUserMap.containsKey(payerId)) {
            throw new BadRequestException("Payer is not an active member of this trip");
        }

        List<User> targetMembers = new ArrayList<>();

        if (splitUserIds != null && !splitUserIds.isEmpty()) {
            List<Long> distinctIds = splitUserIds.stream().distinct().collect(Collectors.toList());
            for (Long uid : distinctIds) {
                if (uid == null) {
                    throw new BadRequestException("One or more split participants are not active members of this trip");
                }
                User member = activeUserMap.get(uid);
                if (member == null) {
                    throw new BadRequestException("One or more split participants are not active members of this trip");
                }
                targetMembers.add(member);
            }
        } else {
            // Fallback: If no split users specified, default to all active trip members
            targetMembers = new ArrayList<>(activeTripUsers);
        }

        // Secondary Fallback: If still empty, use the payer/creator
        if (targetMembers.isEmpty()) {
            Long fallbackUserId = payerId != null ? payerId : (expense.getUser() != null ? expense.getUser().getId() : null);
            if (fallbackUserId != null) {
                userRepository.findById(fallbackUserId).ifPresent(targetMembers::add);
            }
        }

        // Delete existing splits for this expense
        expenseSplitRepository.deleteByExpenseId(expense.getId());

        int count = targetMembers.size();
        if (count == 0) {
            return Collections.emptyList();
        }

        BigDecimal totalAmount = BigDecimal.valueOf(expense.getAmount() != null ? expense.getAmount() : 0.0)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal baseShare = totalAmount.divide(BigDecimal.valueOf(count), 2, RoundingMode.DOWN);
        BigDecimal totalBase = baseShare.multiply(BigDecimal.valueOf(count));
        BigDecimal remainder = totalAmount.subtract(totalBase);
        int remainderCents = remainder.multiply(BigDecimal.valueOf(100)).intValue();

        List<ExpenseSplit> splits = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            User member = targetMembers.get(i);
            BigDecimal memberShare = baseShare;
            if (i < remainderCents) {
                memberShare = memberShare.add(new BigDecimal("0.01"));
            }

            ExpenseSplit split = new ExpenseSplit();
            split.setExpense(expense);
            split.setUser(member);
            split.setAmount(memberShare);
            boolean isPayer = payerId != null && member.getId().equals(payerId);
            split.setSettled(isPayer);
            split.setSettledAt(isPayer ? LocalDateTime.now() : null);

            splits.add(expenseSplitRepository.save(split));
        }

        return splits;
    }

    public List<TripMemberResponse> getTripMembers(Long tripId, Long currentUserId) {
        validateTripAccess(tripId, currentUserId);
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip", "id", tripId));

        Map<Long, TripMemberResponse> memberMap = new LinkedHashMap<>();

        // 1. Owner
        User owner = trip.getUser();
        memberMap.put(owner.getId(), new TripMemberResponse(owner.getId(), owner.getUsername(), owner.getEmail(), "OWNER"));

        // 2. Collaborators with ACCEPTED share
        List<TripShare> shares = tripShareRepository.findByTripId(tripId);
        for (TripShare share : shares) {
            if (share.getStatus() == ShareStatus.ACCEPTED && share.getSharedWithUser() != null) {
                User user = share.getSharedWithUser();
                memberMap.putIfAbsent(user.getId(), new TripMemberResponse(user.getId(), user.getUsername(), user.getEmail(), "COLLABORATOR"));
            }
        }

        // 3. Travel Group Members
        List<TravelGroup> groups = groupRepository.findByTripIdWithDetails(tripId);
        for (TravelGroup group : groups) {
            if (group.getCreatedBy() != null) {
                User user = group.getCreatedBy();
                memberMap.putIfAbsent(user.getId(), new TripMemberResponse(user.getId(), user.getUsername(), user.getEmail(), "MEMBER"));
            }
            if (group.getMembers() != null) {
                for (User member : group.getMembers()) {
                    memberMap.putIfAbsent(member.getId(), new TripMemberResponse(member.getId(), member.getUsername(), member.getEmail(), "MEMBER"));
                }
            }
        }

        return new ArrayList<>(memberMap.values());
    }

    @Transactional
    public DebtSummaryResponse getGroupBalances(Long tripId, Long currentUserId) {
        validateTripAccess(tripId, currentUserId);
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip", "id", tripId));

        List<Expense> expenses = expenseRepository.findByTripIdWithUserAndTrip(tripId);
        if (expenses.isEmpty()) {
            expenses = expenseRepository.findByTripId(tripId);
        }

        // Auto-split any legacy expense that doesn't have splits yet
        for (Expense expense : expenses) {
            List<ExpenseSplit> existingSplits = expenseSplitRepository.findByExpenseId(expense.getId());
            if (existingSplits.isEmpty()) {
                splitExpense(expense, null, expense.getUser().getId());
            }
        }

        List<ExpenseSplit> allSplits = expenseSplitRepository.findByTripIdWithExpenseAndUser(tripId);
        List<Settlement> allSettlements = settlementRepository.findByTripIdWithPayerAndPayee(tripId);

        // Fetch active members to ensure everyone is represented in balances
        List<User> activeUsers = getActiveTripUsers(tripId);
        Map<Long, User> userMap = new LinkedHashMap<>();
        for (User u : activeUsers) {
            userMap.put(u.getId(), u);
        }
        for (Expense e : expenses) {
            if (e.getUser() != null) userMap.putIfAbsent(e.getUser().getId(), e.getUser());
        }
        for (ExpenseSplit s : allSplits) {
            if (s.getUser() != null) userMap.putIfAbsent(s.getUser().getId(), s.getUser());
        }
        for (Settlement set : allSettlements) {
            if (set.getPayer() != null) userMap.putIfAbsent(set.getPayer().getId(), set.getPayer());
            if (set.getPayee() != null) userMap.putIfAbsent(set.getPayee().getId(), set.getPayee());
        }

        // 1. Calculate totalPaid per user
        Map<Long, BigDecimal> totalPaidMap = new HashMap<>();
        BigDecimal totalTripExpenses = BigDecimal.ZERO;
        for (Expense e : expenses) {
            BigDecimal amt = BigDecimal.valueOf(e.getAmount() != null ? e.getAmount() : 0.0)
                    .setScale(2, RoundingMode.HALF_UP);
            totalTripExpenses = totalTripExpenses.add(amt);
            Long uid = e.getUser().getId();
            totalPaidMap.put(uid, totalPaidMap.getOrDefault(uid, BigDecimal.ZERO).add(amt));
        }

        // 2. Calculate totalShareOwed per user
        Map<Long, BigDecimal> totalShareOwedMap = new HashMap<>();
        for (ExpenseSplit s : allSplits) {
            Long uid = s.getUser().getId();
            BigDecimal amt = s.getAmount() != null ? s.getAmount().setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
            totalShareOwedMap.put(uid, totalShareOwedMap.getOrDefault(uid, BigDecimal.ZERO).add(amt));
        }

        // 3. Calculate settlementsPaid and settlementsReceived (from SETTLED records only)
        Map<Long, BigDecimal> settlementsPaidMap = new HashMap<>();
        Map<Long, BigDecimal> settlementsReceivedMap = new HashMap<>();
        List<SettlementHistoryResponse> settledHistory = new ArrayList<>();

        for (Settlement s : allSettlements) {
            if (s.getStatus() == SettlementStatus.SETTLED) {
                BigDecimal amt = s.getAmount().setScale(2, RoundingMode.HALF_UP);
                Long payerId = s.getPayer().getId();
                Long payeeId = s.getPayee().getId();
                settlementsPaidMap.put(payerId, settlementsPaidMap.getOrDefault(payerId, BigDecimal.ZERO).add(amt));
                settlementsReceivedMap.put(payeeId, settlementsReceivedMap.getOrDefault(payeeId, BigDecimal.ZERO).add(amt));

                settledHistory.add(new SettlementHistoryResponse(
                        s.getId(),
                        payerId,
                        s.getPayer().getUsername(),
                        payeeId,
                        s.getPayee().getUsername(),
                        amt,
                        s.getStatus().name(),
                        s.getCreatedAt(),
                        s.getSettledAt()
                ));
            }
        }

        // 4. Compute net balance per user:
        // netBalance = totalPaid - totalShareOwed + settlementsPaid - settlementsReceived
        List<UserBalanceResponse> userBalances = new ArrayList<>();
        Map<Long, BigDecimal> netBalanceMap = new HashMap<>();

        for (User user : userMap.values()) {
            Long uid = user.getId();
            BigDecimal paid = totalPaidMap.getOrDefault(uid, BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
            BigDecimal shareOwed = totalShareOwedMap.getOrDefault(uid, BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
            BigDecimal setPaid = settlementsPaidMap.getOrDefault(uid, BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
            BigDecimal setRecv = settlementsReceivedMap.getOrDefault(uid, BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);

            BigDecimal net = paid.subtract(shareOwed).add(setPaid).subtract(setRecv).setScale(2, RoundingMode.HALF_UP);
            netBalanceMap.put(uid, net);

            String status = "SETTLED";
            if (net.compareTo(new BigDecimal("0.01")) >= 0) {
                status = "IS_OWED";
            } else if (net.compareTo(new BigDecimal("-0.01")) <= 0) {
                status = "OWES";
            }

            userBalances.add(new UserBalanceResponse(
                    uid,
                    user.getUsername(),
                    user.getEmail(),
                    paid,
                    shareOwed,
                    setPaid,
                    setRecv,
                    net,
                    status
            ));
        }

        // 5. Debt Simplification Algorithm (Greedy Bilateral Matching)
        // Debtors have netBalance < -0.005 (owe money)
        // Creditors have netBalance > 0.005 (are owed money)
        class DebtNode {
            final Long userId;
            BigDecimal amount;
            DebtNode(Long userId, BigDecimal amount) {
                this.userId = userId;
                this.amount = amount;
            }
        }

        PriorityQueue<DebtNode> debtors = new PriorityQueue<>((a, b) -> b.amount.compareTo(a.amount));
        PriorityQueue<DebtNode> creditors = new PriorityQueue<>((a, b) -> b.amount.compareTo(a.amount));

        for (Map.Entry<Long, BigDecimal> entry : netBalanceMap.entrySet()) {
            BigDecimal val = entry.getValue();
            if (val.compareTo(new BigDecimal("-0.01")) <= 0) {
                debtors.add(new DebtNode(entry.getKey(), val.abs()));
            } else if (val.compareTo(new BigDecimal("0.01")) >= 0) {
                creditors.add(new DebtNode(entry.getKey(), val));
            }
        }

        List<DebtItemResponse> debtList = new ArrayList<>();
        Set<Long> activePendingSettlementIds = new HashSet<>();

        while (!debtors.isEmpty() && !creditors.isEmpty()) {
            DebtNode debtor = debtors.poll();
            DebtNode creditor = creditors.poll();

            BigDecimal settleAmount = debtor.amount.min(creditor.amount).setScale(2, RoundingMode.HALF_UP);
            if (settleAmount.compareTo(new BigDecimal("0.01")) >= 0) {
                User payerUser = userMap.get(debtor.userId);
                User payeeUser = userMap.get(creditor.userId);

                // Find existing PENDING settlement or create a new one
                Settlement settlement = settlementRepository
                        .findByTripIdAndPayerIdAndPayeeIdAndStatus(tripId, debtor.userId, creditor.userId, SettlementStatus.PENDING)
                        .orElse(null);

                if (settlement == null) {
                    settlement = new Settlement();
                    settlement.setTrip(trip);
                    settlement.setPayer(payerUser);
                    settlement.setPayee(payeeUser);
                    settlement.setAmount(settleAmount);
                    settlement.setStatus(SettlementStatus.PENDING);
                    settlement = settlementRepository.save(settlement);
                } else {
                    settlement.setAmount(settleAmount);
                    settlement = settlementRepository.save(settlement);
                }

                activePendingSettlementIds.add(settlement.getId());

                debtList.add(new DebtItemResponse(
                        settlement.getId(),
                        debtor.userId,
                        payerUser.getUsername(),
                        creditor.userId,
                        payeeUser.getUsername(),
                        settleAmount,
                        "PENDING"
                ));

                BigDecimal debtorRemaining = debtor.amount.subtract(settleAmount).setScale(2, RoundingMode.HALF_UP);
                BigDecimal creditorRemaining = creditor.amount.subtract(settleAmount).setScale(2, RoundingMode.HALF_UP);

                if (debtorRemaining.compareTo(new BigDecimal("0.01")) >= 0) {
                    debtors.add(new DebtNode(debtor.userId, debtorRemaining));
                }
                if (creditorRemaining.compareTo(new BigDecimal("0.01")) >= 0) {
                    creditors.add(new DebtNode(creditor.userId, creditorRemaining));
                }
            }
        }

        // Clean up stale PENDING settlements that are no longer part of current simplified debts
        List<Settlement> existingPending = settlementRepository.findByTripIdAndStatus(tripId, SettlementStatus.PENDING);
        for (Settlement p : existingPending) {
            if (!activePendingSettlementIds.contains(p.getId())) {
                settlementRepository.delete(p);
            }
        }

        DebtSummaryResponse response = new DebtSummaryResponse();
        response.setTripId(trip.getId());
        response.setTripTitle(trip.getTitle());
        response.setTotalExpenses(totalTripExpenses);
        response.setUserBalances(userBalances);
        response.setDebts(debtList);
        response.setSettledHistory(settledHistory);

        return response;
    }

    @Transactional
    public SettlementHistoryResponse settleDebt(Long settlementId, Long currentUserId) {
        Settlement settlement = settlementRepository.findById(settlementId)
                .orElseThrow(() -> new ResourceNotFoundException("Settlement", "id", settlementId));

        Long tripId = settlement.getTrip().getId();
        Trip trip = settlement.getTrip();
        boolean isTripOwner = trip.getUser().getId().equals(currentUserId);
        boolean isPayer = settlement.getPayer().getId().equals(currentUserId);
        boolean isPayee = settlement.getPayee().getId().equals(currentUserId);

        if (!isTripOwner && !isPayer && !isPayee) {
            throw new UnauthorizedAccessException("Only the payer, payee, or trip owner can settle this debt");
        }

        if (settlement.getStatus() == SettlementStatus.SETTLED) {
            throw new BadRequestException("Debt is already marked as settled");
        }

        settlement.setStatus(SettlementStatus.SETTLED);
        settlement.setSettledAt(LocalDateTime.now());
        Settlement saved = settlementRepository.save(settlement);

        // Mark corresponding splits for payer in this trip as settled
        List<ExpenseSplit> payerSplits = expenseSplitRepository.findByTripIdWithExpenseAndUser(tripId)
                .stream()
                .filter(s -> s.getUser().getId().equals(settlement.getPayer().getId()))
                .collect(Collectors.toList());

        for (ExpenseSplit split : payerSplits) {
            split.setSettled(true);
            split.setSettledAt(LocalDateTime.now());
            expenseSplitRepository.save(split);
        }

        return new SettlementHistoryResponse(
                saved.getId(),
                saved.getPayer().getId(),
                saved.getPayer().getUsername(),
                saved.getPayee().getId(),
                saved.getPayee().getUsername(),
                saved.getAmount(),
                saved.getStatus().name(),
                saved.getCreatedAt(),
                saved.getSettledAt()
        );
    }

    public List<ExpenseSplitResponse> getSplitsByExpenseId(Long expenseId, Long currentUserId) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense", "id", expenseId));

        if (expense.getTrip() == null || expense.getTrip().getId() == null) {
            throw new BadRequestException("Expense is not associated with any trip");
        }

        validateTripAccess(expense.getTrip().getId(), currentUserId);

        return expenseSplitRepository.findByExpenseIdWithUser(expenseId)
                .stream()
                .map(s -> new ExpenseSplitResponse(
                        s.getId(),
                        s.getUser().getId(),
                        s.getUser().getUsername(),
                        s.getUser().getEmail(),
                        s.getAmount(),
                        s.isSettled(),
                        s.getSettledAt()
                ))
                .collect(Collectors.toList());
    }

    List<User> getActiveTripUsers(Long tripId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip", "id", tripId));

        Map<Long, User> userMap = new LinkedHashMap<>();
        if (trip.getUser() != null) {
            userMap.put(trip.getUser().getId(), trip.getUser());
        }

        List<TripShare> shares = tripShareRepository.findByTripId(tripId);
        for (TripShare share : shares) {
            if (share.getStatus() == ShareStatus.ACCEPTED && share.getSharedWithUser() != null) {
                userMap.putIfAbsent(share.getSharedWithUser().getId(), share.getSharedWithUser());
            }
        }

        List<TravelGroup> groups = groupRepository.findByTripIdWithDetails(tripId);
        for (TravelGroup group : groups) {
            if (group.getCreatedBy() != null) {
                userMap.putIfAbsent(group.getCreatedBy().getId(), group.getCreatedBy());
            }
            if (group.getMembers() != null) {
                for (User member : group.getMembers()) {
                    userMap.putIfAbsent(member.getId(), member);
                }
            }
        }

        return new ArrayList<>(userMap.values());
    }

    private void validateTripAccess(Long tripId, Long userId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip", "id", tripId));

        boolean isOwner = trip.getUser() != null && trip.getUser().getId().equals(userId);
        boolean hasAccess = tripShareService.hasAccess(tripId, userId);
        boolean isGroupMember = groupRepository.existsByTripIdAndMembersId(tripId, userId);

        if (!isOwner && !hasAccess && !isGroupMember) {
            throw new UnauthorizedAccessException("Unauthorized");
        }
    }
}
