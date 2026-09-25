package com.tripnest.service;

import com.tripnest.dto.BudgetResponse;
import com.tripnest.entity.Budget;
import com.tripnest.entity.Trip;
import com.tripnest.entity.User;
import com.tripnest.repository.BudgetRepository;
import com.tripnest.repository.ExpenseRepository;
import com.tripnest.repository.TripRepository;
import com.tripnest.repository.GroupRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BudgetServiceTest {

    @Mock
    private BudgetRepository budgetRepository;

    @Mock
    private TripRepository tripRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private TripShareService tripShareService;

    @Mock
    private GroupRepository groupRepository;

    @InjectMocks
    private BudgetService budgetService;

    private Trip trip;
    private User user;
    private Budget budget;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setUsername("traveler1");

        trip = new Trip();
        trip.setId(10L);
        trip.setTitle("Goa Vacation");
        trip.setUser(user);

        budget = new Budget();
        budget.setId(100L);
        budget.setTrip(trip);
        budget.setTotalAmount(50000.0);
        budget.setSpentAmount(0.0);
        budget.setRemainingAmount(50000.0);
        budget.setCurrency("INR");
    }

    @Test
    @DisplayName("getBudgetByTripId computes calculated spent and remaining without persisting UPDATE")
    void getBudgetByTripId_ComputesValuesWithoutSaving() {
        when(tripRepository.findById(10L)).thenReturn(Optional.of(trip));
        when(budgetRepository.findByTripId(10L)).thenReturn(Optional.of(budget));
        when(expenseRepository.getTotalExpenseByTripId(10L)).thenReturn(15000.0);

        BudgetResponse response = budgetService.getBudgetByTripId(10L, 1L);

        assertNotNull(response);
        assertEquals(50000.0, response.getTotalAmount());
        assertEquals(15000.0, response.getSpentAmount());
        assertEquals(35000.0, response.getRemainingAmount());
        assertEquals(30.0, response.getPercentageUsed());

        // CRITICAL: verify that budgetRepository.save() is NEVER called on GET
        verify(budgetRepository, never()).save(any(Budget.class));
    }

    @Test
    @DisplayName("getBudgetByTripId grants view access to group member")
    void getBudgetByTripId_GroupMember_GrantsAccess() {
        when(tripRepository.findById(10L)).thenReturn(Optional.of(trip));
        when(tripShareService.hasAccess(10L, 2L)).thenReturn(false);
        when(groupRepository.existsByTripIdAndMemberId(10L, 2L)).thenReturn(true);
        when(budgetRepository.findByTripId(10L)).thenReturn(Optional.of(budget));
        when(expenseRepository.getTotalExpenseByTripId(10L)).thenReturn(5000.0);

        BudgetResponse response = budgetService.getBudgetByTripId(10L, 2L);

        assertNotNull(response);
        assertEquals(50000.0, response.getTotalAmount());
        assertEquals(5000.0, response.getSpentAmount());
        verify(groupRepository).existsByTripIdAndMemberId(10L, 2L);
    }

    @Test
    @DisplayName("getBudgetByTripId throws AccessDeniedException when user is not owner, shared, or group member")
    void getBudgetByTripId_Unauthorized_ThrowsAccessDenied() {
        when(tripRepository.findById(10L)).thenReturn(Optional.of(trip));
        when(tripShareService.hasAccess(10L, 99L)).thenReturn(false);
        when(groupRepository.existsByTripIdAndMemberId(10L, 99L)).thenReturn(false);

        assertThrows(org.springframework.security.access.AccessDeniedException.class, () -> {
            budgetService.getBudgetByTripId(10L, 99L);
        });
    }
}
