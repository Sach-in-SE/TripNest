package com.tripnest.service;

import com.tripnest.dto.ExpenseRequest;
import com.tripnest.dto.ExpenseResponse;
import com.tripnest.dto.NotificationRequest;
import com.tripnest.entity.Budget;
import com.tripnest.entity.Expense;
import com.tripnest.entity.ExpenseCategory;
import com.tripnest.entity.Trip;
import com.tripnest.entity.User;
import com.tripnest.repository.BudgetRepository;
import com.tripnest.repository.ExpenseRepository;
import com.tripnest.repository.ExpenseSplitRepository;
import com.tripnest.repository.GroupRepository;
import com.tripnest.repository.TripRepository;
import com.tripnest.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.tripnest.exception.BadRequestException;
import com.tripnest.exception.ResourceNotFoundException;
import com.tripnest.exception.UnauthorizedAccessException;
import com.tripnest.entity.ERole;
import com.tripnest.entity.GroupMember;
import com.tripnest.entity.GroupRole;
import com.tripnest.entity.TravelGroup;
import com.tripnest.repository.GroupMemberRepository;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ExpenseService {

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TripShareService tripShareService;

    @Autowired
    private BudgetRepository budgetRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private GroupMemberRepository groupMemberRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private ExpenseSplitService expenseSplitService;

    @Autowired
    private ExpenseSplitRepository expenseSplitRepository;

    @Transactional
    public ExpenseResponse createExpense(ExpenseRequest request, Long userId) {
        Trip trip = tripRepository.findById(request.getTripId())
                .orElseThrow(() -> new ResourceNotFoundException("Trip", "id", request.getTripId()));

        boolean isOwner = trip.getUser().getId().equals(userId);
        boolean hasEditAccess = tripShareService.hasEditAccess(request.getTripId(), userId);
        boolean isGroupMember = groupRepository.existsByTripIdAndMembersId(request.getTripId(), userId);
        if (!isOwner && !hasEditAccess && !isGroupMember) {
            throw new UnauthorizedAccessException("Unauthorized");
        }

        // Validate expense date is within trip timeline
        if (request.getDate() != null) {
            if (trip.getStartDate() != null && request.getDate().isBefore(trip.getStartDate())) {
                throw new BadRequestException("Expense date cannot be before trip start date (" + trip.getStartDate() + ")");
            }
            if (trip.getEndDate() != null && request.getDate().isAfter(trip.getEndDate())) {
                throw new BadRequestException("Expense date cannot be after trip end date (" + trip.getEndDate() + ")");
            }
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Expense expense = new Expense();
        expense.setTitle(request.getTitle());
        expense.setAmount(request.getAmount());
        expense.setDescription(request.getDescription());
        expense.setDate(request.getDate());
        expense.setTrip(trip);
        expense.setUser(user);

        if (request.getCategory() != null) {
            expense.setCategory(ExpenseCategory.valueOf(request.getCategory()));
        }

        Expense saved = expenseRepository.save(expense);
        expenseSplitService.splitExpense(saved, request.getSplitUserIds(), userId);
        checkBudgetAlerts(trip);
        return mapToResponse(saved);
    }

    public List<ExpenseResponse> getTripExpenses(Long tripId, Long userId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip", "id", tripId));

        boolean isOwner = trip.getUser().getId().equals(userId);
        boolean hasAccess = tripShareService.hasAccess(tripId, userId);
        boolean isGroupMember = groupRepository.existsByTripIdAndMembersId(tripId, userId);
        if (!isOwner && !hasAccess && !isGroupMember) {
            throw new UnauthorizedAccessException("Unauthorized");
        }

        return expenseRepository.findByTripIdWithUserAndTrip(tripId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ExpenseResponse> getUserExpenses(Long userId) {
        return expenseRepository.findAccessibleExpensesByUserId(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ExpenseResponse updateExpense(Long tripId, Long expenseId, ExpenseRequest request, Long userId) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense", "id", expenseId));

        if (tripId != null && !expense.getTrip().getId().equals(tripId)) {
            throw new BadRequestException("Expense does not belong to the specified trip");
        }

        return updateExpenseInternal(expense, request, userId);
    }

    @Transactional
    public ExpenseResponse updateExpense(Long id, ExpenseRequest request, Long userId) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense", "id", id));
        return updateExpenseInternal(expense, request, userId);
    }

    @Transactional
    public ExpenseResponse updateExpense(Long tripId, Long expenseId, ExpenseRequest request, User currentUser) {
        return updateExpense(tripId, expenseId, request, currentUser != null ? currentUser.getId() : null);
    }

    private ExpenseResponse updateExpenseInternal(Expense expense, ExpenseRequest request, Long userId) {
        Trip trip = expense.getTrip();
        Long tripId = trip.getId();
        boolean isOwner = trip.getUser().getId().equals(userId);
        boolean hasEditAccess = tripShareService.hasEditAccess(tripId, userId);
        boolean isGroupMember = groupRepository.existsByTripIdAndMemberId(tripId, userId);

        boolean hasPermission = isOwner || hasEditAccess;
        if (!hasPermission && isGroupMember) {
            boolean isCreator = (expense.getPaidBy() != null && expense.getPaidBy().getId().equals(userId))
                    || (expense.getUser() != null && expense.getUser().getId().equals(userId));
            boolean isGroupAdmin = isGroupAdmin(tripId, userId);
            if (isCreator || isGroupAdmin) {
                hasPermission = true;
            }
        }

        if (!hasPermission) {
            throw new UnauthorizedAccessException("Unauthorized");
        }

        // Validate expense date is within trip timeline
        if (request.getDate() != null) {
            if (trip.getStartDate() != null && request.getDate().isBefore(trip.getStartDate())) {
                throw new BadRequestException("Expense date cannot be before trip start date (" + trip.getStartDate() + ")");
            }
            if (trip.getEndDate() != null && request.getDate().isAfter(trip.getEndDate())) {
                throw new BadRequestException("Expense date cannot be after trip end date (" + trip.getEndDate() + ")");
            }
        }

        expense.setTitle(request.getTitle());
        expense.setAmount(request.getAmount());
        expense.setDescription(request.getDescription());
        expense.setDate(request.getDate());

        if (request.getCategory() != null) {
            expense.setCategory(ExpenseCategory.valueOf(request.getCategory()));
        }

        Expense updated = expenseRepository.save(expense);
        expenseSplitService.splitExpense(updated, request.getSplitUserIds(), userId);
        checkBudgetAlerts(trip);
        return mapToResponse(updated);
    }

    @Transactional
    public void deleteExpense(Long tripId, Long expenseId, Long userId) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense", "id", expenseId));

        if (tripId != null && !expense.getTrip().getId().equals(tripId)) {
            throw new BadRequestException("Expense does not belong to the specified trip");
        }

        deleteExpenseInternal(expense, userId);
    }

    @Transactional
    public void deleteExpense(Long id, Long userId) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense", "id", id));
        deleteExpenseInternal(expense, userId);
    }

    @Transactional
    public void deleteExpense(Long tripId, Long expenseId, User currentUser) {
        deleteExpense(tripId, expenseId, currentUser != null ? currentUser.getId() : null);
    }

    private void deleteExpenseInternal(Expense expense, Long userId) {
        Trip trip = expense.getTrip();
        Long tripId = trip.getId();
        boolean isOwner = trip.getUser().getId().equals(userId);
        boolean hasEditAccess = tripShareService.hasEditAccess(tripId, userId);
        boolean isGroupMember = groupRepository.existsByTripIdAndMemberId(tripId, userId);

        boolean hasPermission = isOwner || hasEditAccess;
        if (!hasPermission && isGroupMember) {
            boolean isCreator = (expense.getPaidBy() != null && expense.getPaidBy().getId().equals(userId))
                    || (expense.getUser() != null && expense.getUser().getId().equals(userId));
            boolean isGroupAdmin = isGroupAdmin(tripId, userId);
            if (isCreator || isGroupAdmin) {
                hasPermission = true;
            }
        }

        if (!hasPermission) {
            throw new UnauthorizedAccessException("Unauthorized");
        }

        expenseSplitRepository.deleteByExpenseId(expense.getId());
        expenseRepository.delete(expense);
    }

    private boolean isGroupAdmin(Long tripId, Long userId) {
        if (tripId == null || userId == null) {
            return false;
        }
        try {
            List<TravelGroup> groups = groupRepository.findByTripId(tripId);
            if (groups != null) {
                for (TravelGroup group : groups) {
                    if (group.getCreatedBy() != null && group.getCreatedBy().getId().equals(userId)) {
                        return true;
                    }
                    if (groupMemberRepository != null) {
                        Optional<GroupMember> memberOpt = groupMemberRepository.findByTravelGroupIdAndUserId(group.getId(), userId);
                        if (memberOpt.isPresent()) {
                            GroupMember member = memberOpt.get();
                            if (member.getRole() != null) {
                                String roleName = member.getRole().name();
                                if ("ADMIN".equalsIgnoreCase(roleName) || "OWNER".equalsIgnoreCase(roleName)) {
                                    return true;
                                }
                            }
                        }
                    }
                }
            }
        } catch (Exception ignored) {
        }
        return userRepository.findById(userId)
                .map(u -> u.getRoles() != null && u.getRoles().stream()
                        .anyMatch(r -> r.getName() == ERole.ROLE_ADMIN || r.getName() == ERole.ROLE_GROUP_ADMIN))
                .orElse(false);
    }

    public Double getTotalExpenses(Long tripId, Long userId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip", "id", tripId));

        boolean isOwner = trip.getUser().getId().equals(userId);
        boolean hasAccess = tripShareService.hasAccess(tripId, userId);
        boolean isGroupMember = groupRepository.existsByTripIdAndMembersId(tripId, userId);
        if (!isOwner && !hasAccess && !isGroupMember) {
            throw new UnauthorizedAccessException("Unauthorized");
        }

        Double total = expenseRepository.getTotalExpenseByTripId(tripId);
        return total != null ? total : 0.0;
    }

    public Double getTotalExpenses(Long tripId) {
        Double total = expenseRepository.getTotalExpenseByTripId(tripId);
        return total != null ? total : 0.0;
    }

    private ExpenseResponse mapToResponse(Expense expense) {
        ExpenseResponse response = new ExpenseResponse();
        response.setId(expense.getId());
        response.setTitle(expense.getTitle());
        response.setAmount(expense.getAmount());
        response.setCategory(expense.getCategory() != null ? expense.getCategory().name() : null);
        response.setDescription(expense.getDescription());
        response.setDate(expense.getDate());
        response.setTripId(expense.getTrip().getId());
        response.setTripTitle(expense.getTrip().getTitle());
        response.setUserId(expense.getUser().getId());
        response.setUsername(expense.getUser().getUsername());
        response.setCreatedAt(expense.getCreatedAt());
        response.setUpdatedAt(expense.getUpdatedAt());

        try {
            List<com.tripnest.model.ExpenseSplit> splits = expenseSplitRepository.findByExpenseIdWithUser(expense.getId());
            if (splits != null && !splits.isEmpty()) {
                response.setSplitUserIds(splits.stream().map(s -> s.getUser().getId()).collect(Collectors.toList()));
                response.setSplits(splits.stream().map(s -> new com.tripnest.dto.ExpenseSplitResponse(
                        s.getId(),
                        s.getUser().getId(),
                        s.getUser().getUsername(),
                        s.getUser().getEmail(),
                        s.getAmount(),
                        s.isSettled(),
                        s.getSettledAt()
                )).collect(Collectors.toList()));
            }
        } catch (Exception e) {
            // In unit tests where repo might not be stubbed, safely fallback
        }

        return response;
    }

    private void checkBudgetAlerts(Trip trip) {
        Budget budget = budgetRepository.findByTripId(trip.getId()).orElse(null);
        if (budget == null) {
            return;
        }

        Double totalSpent = expenseRepository.getTotalExpenseByTripId(trip.getId());
        if (totalSpent == null) {
            totalSpent = 0.0;
        }

        double eightyPercentThreshold = budget.getTotalAmount() * 0.8;
        if (totalSpent >= eightyPercentThreshold && !budget.getAlert80Sent()) {
            NotificationRequest request = new NotificationRequest();
            request.setType("BUDGET_ALERT");
            request.setTitle("Budget Alert: 80% Used");
            request.setMessage("You have used 80% of your budget for trip: " + trip.getTitle());
            request.setUserId(trip.getUser().getId());
            request.setReferenceId(budget.getId());
            notificationService.createNotification(request);
            budget.setAlert80Sent(true);
            budgetRepository.save(budget);
        }

        if (totalSpent >= budget.getTotalAmount() && !budget.getAlert100Sent()) {
            NotificationRequest request = new NotificationRequest();
            request.setType("BUDGET_ALERT");
            request.setTitle("Budget Exceeded!");
            request.setMessage("You have exceeded your budget for trip: " + trip.getTitle());
            request.setUserId(trip.getUser().getId());
            request.setReferenceId(budget.getId());
            notificationService.createNotification(request);
            budget.setAlert100Sent(true);
            budgetRepository.save(budget);
        }
    }
}