package com.tripnest.service;

import com.tripnest.dto.ExpenseRequest;
import com.tripnest.dto.ExpenseResponse;
import com.tripnest.entity.*;
import com.tripnest.exception.UnauthorizedAccessException;
import com.tripnest.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ExpenseServiceTest {

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private TripRepository tripRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TripShareService tripShareService;

    @Mock
    private BudgetRepository budgetRepository;

    @Mock
    private GroupRepository groupRepository;

    @Mock
    private GroupMemberRepository groupMemberRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private ExpenseSplitService expenseSplitService;

    @Mock
    private ExpenseSplitRepository expenseSplitRepository;

    @InjectMocks
    private ExpenseService expenseService;

    private User tripOwner;
    private User expenseCreator;
    private User groupAdmin;
    private User normalMember;
    private User stranger;

    private Trip trip;
    private Expense expense;
    private TravelGroup group;

    @BeforeEach
    void setUp() {
        tripOwner = new User();
        tripOwner.setId(1L);
        tripOwner.setUsername("tripOwner");

        expenseCreator = new User();
        expenseCreator.setId(2L);
        expenseCreator.setUsername("expenseCreator");

        groupAdmin = new User();
        groupAdmin.setId(3L);
        groupAdmin.setUsername("groupAdmin");

        normalMember = new User();
        normalMember.setId(4L);
        normalMember.setUsername("normalMember");

        stranger = new User();
        stranger.setId(5L);
        stranger.setUsername("stranger");

        trip = new Trip();
        trip.setId(10L);
        trip.setTitle("Euro Trip");
        trip.setUser(tripOwner);
        trip.setStartDate(LocalDate.now().minusDays(5));
        trip.setEndDate(LocalDate.now().plusDays(5));

        group = new TravelGroup();
        group.setId(100L);
        group.setTrip(trip);
        group.setMembers(Set.of(tripOwner, expenseCreator, groupAdmin, normalMember));

        expense = new Expense();
        expense.setId(50L);
        expense.setTitle("Dinner");
        expense.setAmount(100.0);
        expense.setCategory(ExpenseCategory.FOOD);
        expense.setDate(LocalDate.now());
        expense.setTrip(trip);
        expense.setUser(expenseCreator);
    }

    @Test
    @DisplayName("Trip owner can update expense")
    void updateExpense_TripOwner_Success() {
        when(expenseRepository.findById(50L)).thenReturn(Optional.of(expense));
        when(expenseRepository.save(any(Expense.class))).thenReturn(expense);

        ExpenseRequest request = new ExpenseRequest();
        request.setTitle("Dinner Updated");
        request.setAmount(120.0);

        ExpenseResponse response = expenseService.updateExpense(10L, 50L, request, 1L);
        assertNotNull(response);
        verify(expenseRepository).save(any(Expense.class));
    }

    @Test
    @DisplayName("User with edit share access can update expense")
    void updateExpense_EditShareAccess_Success() {
        when(expenseRepository.findById(50L)).thenReturn(Optional.of(expense));
        when(tripShareService.hasEditAccess(10L, 20L)).thenReturn(true);
        when(expenseRepository.save(any(Expense.class))).thenReturn(expense);

        ExpenseRequest request = new ExpenseRequest();
        request.setTitle("Dinner Edit Access");
        request.setAmount(130.0);

        ExpenseResponse response = expenseService.updateExpense(10L, 50L, request, 20L);
        assertNotNull(response);
        verify(expenseRepository).save(any(Expense.class));
    }

    @Test
    @DisplayName("Group member who created the expense can update it")
    void updateExpense_GroupMemberCreator_Success() {
        when(expenseRepository.findById(50L)).thenReturn(Optional.of(expense));
        when(tripShareService.hasEditAccess(10L, 2L)).thenReturn(false);
        when(groupRepository.existsByTripIdAndMemberId(10L, 2L)).thenReturn(true);
        when(expenseRepository.save(any(Expense.class))).thenReturn(expense);

        ExpenseRequest request = new ExpenseRequest();
        request.setTitle("Dinner Creator Update");
        request.setAmount(140.0);

        ExpenseResponse response = expenseService.updateExpense(10L, 50L, request, 2L);
        assertNotNull(response);
        verify(expenseRepository).save(any(Expense.class));
    }

    @Test
    @DisplayName("Group member holding admin role in group can update expense")
    void updateExpense_GroupAdmin_Success() {
        when(expenseRepository.findById(50L)).thenReturn(Optional.of(expense));
        when(tripShareService.hasEditAccess(10L, 3L)).thenReturn(false);
        when(groupRepository.existsByTripIdAndMemberId(10L, 3L)).thenReturn(true);
        when(groupRepository.findByTripId(10L)).thenReturn(List.of(group));

        GroupMember adminMembership = new GroupMember();
        adminMembership.setRole(GroupRole.ADMIN);
        when(groupMemberRepository.findByTravelGroupIdAndUserId(100L, 3L)).thenReturn(Optional.of(adminMembership));
        when(expenseRepository.save(any(Expense.class))).thenReturn(expense);

        ExpenseRequest request = new ExpenseRequest();
        request.setTitle("Dinner Group Admin Update");
        request.setAmount(150.0);

        ExpenseResponse response = expenseService.updateExpense(10L, 50L, request, 3L);
        assertNotNull(response);
        verify(expenseRepository).save(any(Expense.class));
    }

    @Test
    @DisplayName("Normal group member who did not create expense cannot update it")
    void updateExpense_NormalMemberNonCreator_ThrowsUnauthorized() {
        when(expenseRepository.findById(50L)).thenReturn(Optional.of(expense));
        when(tripShareService.hasEditAccess(10L, 4L)).thenReturn(false);
        when(groupRepository.existsByTripIdAndMemberId(10L, 4L)).thenReturn(true);
        when(groupRepository.findByTripId(10L)).thenReturn(List.of(group));

        GroupMember memberMembership = new GroupMember();
        memberMembership.setRole(GroupRole.MEMBER);
        when(groupMemberRepository.findByTravelGroupIdAndUserId(100L, 4L)).thenReturn(Optional.of(memberMembership));
        when(userRepository.findById(4L)).thenReturn(Optional.of(normalMember));

        ExpenseRequest request = new ExpenseRequest();
        request.setTitle("Dinner Hack");
        request.setAmount(200.0);

        assertThrows(UnauthorizedAccessException.class, () -> {
            expenseService.updateExpense(10L, 50L, request, 4L);
        });
    }

    @Test
    @DisplayName("Non-member stranger cannot update expense")
    void updateExpense_Stranger_ThrowsUnauthorized() {
        when(expenseRepository.findById(50L)).thenReturn(Optional.of(expense));
        when(tripShareService.hasEditAccess(10L, 5L)).thenReturn(false);
        when(groupRepository.existsByTripIdAndMemberId(10L, 5L)).thenReturn(false);

        ExpenseRequest request = new ExpenseRequest();
        request.setTitle("Dinner Stranger");
        request.setAmount(500.0);

        assertThrows(UnauthorizedAccessException.class, () -> {
            expenseService.updateExpense(10L, 50L, request, 5L);
        });
    }

    @Test
    @DisplayName("Group member creator can delete expense")
    void deleteExpense_GroupMemberCreator_Success() {
        when(expenseRepository.findById(50L)).thenReturn(Optional.of(expense));
        when(tripShareService.hasEditAccess(10L, 2L)).thenReturn(false);
        when(groupRepository.existsByTripIdAndMemberId(10L, 2L)).thenReturn(true);

        expenseService.deleteExpense(10L, 50L, 2L);

        verify(expenseSplitRepository).deleteByExpenseId(50L);
        verify(expenseRepository).delete(expense);
    }

    @Test
    @DisplayName("Group member admin can delete expense created by another user")
    void deleteExpense_GroupAdmin_Success() {
        when(expenseRepository.findById(50L)).thenReturn(Optional.of(expense));
        when(tripShareService.hasEditAccess(10L, 3L)).thenReturn(false);
        when(groupRepository.existsByTripIdAndMemberId(10L, 3L)).thenReturn(true);
        when(groupRepository.findByTripId(10L)).thenReturn(List.of(group));

        GroupMember adminMembership = new GroupMember();
        adminMembership.setRole(GroupRole.ADMIN);
        when(groupMemberRepository.findByTravelGroupIdAndUserId(100L, 3L)).thenReturn(Optional.of(adminMembership));

        expenseService.deleteExpense(10L, 50L, 3L);

        verify(expenseSplitRepository).deleteByExpenseId(50L);
        verify(expenseRepository).delete(expense);
    }

    @Test
    @DisplayName("Normal group member cannot delete expense created by another user")
    void deleteExpense_NormalMember_ThrowsUnauthorized() {
        when(expenseRepository.findById(50L)).thenReturn(Optional.of(expense));
        when(tripShareService.hasEditAccess(10L, 4L)).thenReturn(false);
        when(groupRepository.existsByTripIdAndMemberId(10L, 4L)).thenReturn(true);
        when(groupRepository.findByTripId(10L)).thenReturn(List.of(group));

        GroupMember memberMembership = new GroupMember();
        memberMembership.setRole(GroupRole.MEMBER);
        when(groupMemberRepository.findByTravelGroupIdAndUserId(100L, 4L)).thenReturn(Optional.of(memberMembership));
        when(userRepository.findById(4L)).thenReturn(Optional.of(normalMember));

        assertThrows(UnauthorizedAccessException.class, () -> {
            expenseService.deleteExpense(10L, 50L, 4L);
        });
    }
}
