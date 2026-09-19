package com.tripnest.service;

import com.tripnest.dto.DebtSummaryResponse;
import com.tripnest.dto.SettlementHistoryResponse;
import com.tripnest.dto.TripMemberResponse;
import com.tripnest.entity.*;
import com.tripnest.exception.BadRequestException;
import com.tripnest.exception.UnauthorizedAccessException;
import com.tripnest.model.ExpenseSplit;
import com.tripnest.model.Settlement;
import com.tripnest.model.SettlementStatus;
import com.tripnest.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExpenseSplitServiceTest {

    @Mock
    private ExpenseSplitRepository expenseSplitRepository;

    @Mock
    private SettlementRepository settlementRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private TripRepository tripRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TripShareRepository tripShareRepository;

    @Mock
    private GroupRepository groupRepository;

    @Mock
    private TripShareService tripShareService;

    @InjectMocks
    private ExpenseSplitService expenseSplitService;

    private User alice;
    private User bob;
    private User charlie;
    private Trip trip;
    private Expense expense;

    @BeforeEach
    void setUp() {
        alice = new User();
        alice.setId(1L);
        alice.setUsername("alice");
        alice.setEmail("alice@test.com");

        bob = new User();
        bob.setId(2L);
        bob.setUsername("bob");
        bob.setEmail("bob@test.com");

        charlie = new User();
        charlie.setId(3L);
        charlie.setUsername("charlie");
        charlie.setEmail("charlie@test.com");

        trip = new Trip();
        trip.setId(10L);
        trip.setTitle("Euro Trip 2026");
        trip.setUser(alice);

        expense = new Expense();
        expense.setId(100L);
        expense.setTitle("Group Dinner");
        expense.setAmount(100.0); // ₹100.00 split among 3: 33.34, 33.33, 33.33
        expense.setTrip(trip);
        expense.setUser(alice);
    }

    @Test
    @DisplayName("splitExpense divides amount equally and distributes remainder cents correctly")
    void testSplitExpense_RemainderDistribution() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(alice));
        when(userRepository.findById(2L)).thenReturn(Optional.of(bob));
        when(userRepository.findById(3L)).thenReturn(Optional.of(charlie));
        when(expenseSplitRepository.save(any(ExpenseSplit.class))).thenAnswer(invocation -> invocation.getArgument(0));

        List<ExpenseSplit> splits = expenseSplitService.splitExpense(expense, List.of(1L, 2L, 3L), alice.getId());

        assertEquals(3, splits.size());
        verify(expenseSplitRepository).deleteByExpenseId(100L);

        // First member gets 33.34, others get 33.33 -> Total 100.00
        assertEquals(new BigDecimal("33.34"), splits.get(0).getAmount());
        assertEquals(new BigDecimal("33.33"), splits.get(1).getAmount());
        assertEquals(new BigDecimal("33.33"), splits.get(2).getAmount());

        BigDecimal total = splits.stream().map(ExpenseSplit::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        assertEquals(new BigDecimal("100.00"), total);

        // Payer's split is automatically marked as settled
        assertTrue(splits.get(0).isSettled());
        assertFalse(splits.get(1).isSettled());
        assertFalse(splits.get(2).isSettled());
    }

    @Test
    @DisplayName("getGroupBalances computes net balance and simplifies bilateral debts")
    void testGetGroupBalances_Simplification() {
        when(tripRepository.findById(10L)).thenReturn(Optional.of(trip));

        // Setup expenses: Alice paid 300 for Alice, Bob, Charlie (100 each)
        expense.setAmount(300.0);
        when(expenseRepository.findByTripIdWithUserAndTrip(10L)).thenReturn(List.of(expense));

        ExpenseSplit s1 = new ExpenseSplit(1L, expense, alice, new BigDecimal("100.00"), true, null);
        ExpenseSplit s2 = new ExpenseSplit(2L, expense, bob, new BigDecimal("100.00"), false, null);
        ExpenseSplit s3 = new ExpenseSplit(3L, expense, charlie, new BigDecimal("100.00"), false, null);

        when(expenseSplitRepository.findByExpenseId(100L)).thenReturn(List.of(s1, s2, s3));
        when(expenseSplitRepository.findByTripIdWithExpenseAndUser(10L)).thenReturn(List.of(s1, s2, s3));
        when(settlementRepository.findByTripIdWithPayerAndPayee(10L)).thenReturn(Collections.emptyList());
        when(settlementRepository.findByTripIdAndStatus(10L, SettlementStatus.PENDING)).thenReturn(Collections.emptyList());

        when(settlementRepository.save(any(Settlement.class))).thenAnswer(invocation -> {
            Settlement s = invocation.getArgument(0);
            s.setId(500L);
            return s;
        });

        DebtSummaryResponse summary = expenseSplitService.getGroupBalances(10L, 1L);

        assertNotNull(summary);
        assertEquals(new BigDecimal("300.00"), summary.getTotalExpenses());

        // Alice: Paid 300, Share 100 -> Net +200
        // Bob: Paid 0, Share 100 -> Net -100
        // Charlie: Paid 0, Share 100 -> Net -100
        assertEquals(2, summary.getDebts().size());

        boolean bobOwesAlice = summary.getDebts().stream()
                .anyMatch(d -> d.getPayerId().equals(2L) && d.getPayeeId().equals(1L) && d.getAmount().compareTo(new BigDecimal("100.00")) == 0);
        boolean charlieOwesAlice = summary.getDebts().stream()
                .anyMatch(d -> d.getPayerId().equals(3L) && d.getPayeeId().equals(1L) && d.getAmount().compareTo(new BigDecimal("100.00")) == 0);

        assertTrue(bobOwesAlice);
        assertTrue(charlieOwesAlice);
    }

    @Test
    @DisplayName("settleDebt marks status as SETTLED and records settledAt timestamp")
    void testSettleDebt_Success() {
        Settlement settlement = new Settlement();
        settlement.setId(77L);
        settlement.setTrip(trip);
        settlement.setPayer(bob);
        settlement.setPayee(alice);
        settlement.setAmount(new BigDecimal("100.00"));
        settlement.setStatus(SettlementStatus.PENDING);

        when(settlementRepository.findById(77L)).thenReturn(Optional.of(settlement));
        when(settlementRepository.save(any(Settlement.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(expenseSplitRepository.findByTripIdWithExpenseAndUser(10L)).thenReturn(Collections.emptyList());

        SettlementHistoryResponse result = expenseSplitService.settleDebt(77L, bob.getId());

        assertNotNull(result);
        assertEquals(SettlementStatus.SETTLED.name(), result.getStatus());
        assertNotNull(result.getSettledAt());
        verify(settlementRepository).save(settlement);
    }

    @Test
    @DisplayName("settleDebt throws UnauthorizedAccessException if user is not payer, payee, or trip owner")
    void testSettleDebt_Unauthorized() {
        Settlement settlement = new Settlement();
        settlement.setId(77L);
        settlement.setTrip(trip);
        settlement.setPayer(bob);
        settlement.setPayee(alice);
        settlement.setStatus(SettlementStatus.PENDING);

        when(settlementRepository.findById(77L)).thenReturn(Optional.of(settlement));

        // Charlie (id 3L) is neither payer (bob), payee (alice), nor owner (alice)
        assertThrows(UnauthorizedAccessException.class, () -> {
            expenseSplitService.settleDebt(77L, 3L);
        });
    }

    @Test
    @DisplayName("settleDebt throws BadRequestException if debt is already settled")
    void testSettleDebt_AlreadySettled() {
        Settlement settlement = new Settlement();
        settlement.setId(77L);
        settlement.setTrip(trip);
        settlement.setPayer(bob);
        settlement.setPayee(alice);
        settlement.setStatus(SettlementStatus.SETTLED);

        when(settlementRepository.findById(77L)).thenReturn(Optional.of(settlement));

        assertThrows(BadRequestException.class, () -> {
            expenseSplitService.settleDebt(77L, bob.getId());
        });
    }
}
