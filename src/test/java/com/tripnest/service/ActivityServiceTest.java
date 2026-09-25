package com.tripnest.service;

import com.tripnest.dto.ActivityRequest;
import com.tripnest.dto.ActivityResponse;
import com.tripnest.entity.Activity;
import com.tripnest.entity.Itinerary;
import com.tripnest.entity.Trip;
import com.tripnest.entity.User;
import com.tripnest.repository.ActivityRepository;
import com.tripnest.repository.ExpenseRepository;
import com.tripnest.repository.ItineraryRepository;
import com.tripnest.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ActivityServiceTest {

    @Mock
    private ActivityRepository activityRepository;

    @Mock
    private ItineraryRepository itineraryRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ExpenseService expenseService;

    @Mock
    private TripTimelineValidator tripTimelineValidator;

    @Mock
    private TripShareService tripShareService;

    @Mock
    private TravelUpdateNotificationService travelUpdateNotificationService;

    @InjectMocks
    private ActivityService activityService;

    private User owner;
    private Trip trip;
    private Itinerary itinerary;

    @BeforeEach
    void setUp() {
        owner = new User();
        owner.setId(1L);
        owner.setUsername("john_doe");

        trip = new Trip();
        trip.setId(10L);
        trip.setUser(owner);

        itinerary = new Itinerary();
        itinerary.setId(100L);
        itinerary.setDate(LocalDate.now());
        itinerary.setTrip(trip);
    }

    @Test
    void testCreateActivity_StoresAuthenticatedUserAsCreator_And_ReturnsCreatorInfo() {
        ActivityRequest request = new ActivityRequest();
        request.setItineraryId(100L);
        request.setTitle("Visit Eiffel Tower");
        request.setStartTime(LocalTime.of(10, 0));

        when(itineraryRepository.findById(100L)).thenReturn(Optional.of(itinerary));
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        when(activityRepository.save(any(Activity.class))).thenAnswer(i -> {
            Activity a = i.getArgument(0);
            a.setId(500L);
            return a;
        });

        ActivityResponse response = activityService.createActivity(request, 1L);

        assertNotNull(response);
        assertEquals(500L, response.getId());
        assertEquals(1L, response.getUserId());
        assertEquals("john_doe", response.getUsername());
        verify(activityRepository).save(any(Activity.class));
    }

    @Test
    void testMapToResponse_LegacyActivityWithoutUser_ReturnsNullUserFields() {
        Activity legacyActivity = new Activity();
        legacyActivity.setId(501L);
        legacyActivity.setTitle("Old activity");
        legacyActivity.setItinerary(itinerary);
        legacyActivity.setUser(null);

        when(itineraryRepository.findById(100L)).thenReturn(Optional.of(itinerary));
        when(activityRepository.findByItineraryIdOrderByStartTimeAsc(100L)).thenReturn(List.of(legacyActivity));

        List<ActivityResponse> responses = activityService.getItineraryActivities(100L, 1L);

        assertEquals(1, responses.size());
        assertNull(responses.get(0).getUserId());
        assertNull(responses.get(0).getUsername());
    }

    @Test
    void testGetItineraryActivities_UnauthorizedUser_ThrowsException() {
        when(itineraryRepository.findById(100L)).thenReturn(Optional.of(itinerary));
        when(tripShareService.hasAccess(10L, 2L)).thenReturn(false);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            activityService.getItineraryActivities(100L, 2L);
        });

        assertEquals("Unauthorized", ex.getMessage());
    }

    @Test
    void testUpdateActivity_ZeroCostRemovesLinkedExpense() {
        Activity act = new Activity();
        act.setId(500L);
        act.setTitle("Museum Visit");
        act.setCost(50.0);
        act.setLinkedExpenseId(999L);
        act.setItinerary(itinerary);
        act.setUser(owner);

        when(activityRepository.findById(500L)).thenReturn(Optional.of(act));
        when(activityRepository.save(any(Activity.class))).thenAnswer(i -> i.getArgument(0));

        com.tripnest.entity.Expense exp = new com.tripnest.entity.Expense();
        exp.setId(999L);
        exp.setAmount(50.0);
        when(expenseRepository.findById(999L)).thenReturn(Optional.of(exp));

        ActivityRequest req = new ActivityRequest();
        req.setTitle("Museum Visit Free");
        req.setCost(0.0);

        ActivityResponse resp = activityService.updateActivity(500L, req, 1L);

        assertNotNull(resp);
        verify(expenseRepository).delete(exp);
        assertNull(act.getLinkedExpenseId());
    }

    @Test
    void testUpdateActivity_UpdatesExistingLinkedExpenseTitleAndAmount() {
        Activity act = new Activity();
        act.setId(500L);
        act.setTitle("Museum Visit");
        act.setCost(50.0);
        act.setLinkedExpenseId(999L);
        act.setItinerary(itinerary);
        act.setUser(owner);

        when(activityRepository.findById(500L)).thenReturn(Optional.of(act));
        when(activityRepository.save(any(Activity.class))).thenAnswer(i -> i.getArgument(0));

        com.tripnest.entity.Expense exp = new com.tripnest.entity.Expense();
        exp.setId(999L);
        exp.setTitle("Museum Visit");
        exp.setAmount(50.0);
        when(expenseRepository.findById(999L)).thenReturn(Optional.of(exp));

        ActivityRequest req = new ActivityRequest();
        req.setTitle("Museum Visit Premium");
        req.setCost(120.0);

        ActivityResponse resp = activityService.updateActivity(500L, req, 1L);

        assertNotNull(resp);
        assertEquals(120.0, exp.getAmount());
        assertEquals("Museum Visit Premium", exp.getTitle());
        verify(expenseRepository).save(exp);
    }

    @Test
    void testUpdateActivity_CreatesLinkedExpenseWhenNoneExistedAndCostPositive() {
        Activity act = new Activity();
        act.setId(500L);
        act.setTitle("Museum Visit");
        act.setCost(0.0);
        act.setLinkedExpenseId(null);
        act.setItinerary(itinerary);
        act.setUser(owner);

        when(activityRepository.findById(500L)).thenReturn(Optional.of(act));
        when(activityRepository.save(any(Activity.class))).thenAnswer(i -> i.getArgument(0));

        com.tripnest.dto.ExpenseResponse expResp = new com.tripnest.dto.ExpenseResponse();
        expResp.setId(888L);
        when(expenseService.createExpense(any(), eq(1L))).thenReturn(expResp);

        ActivityRequest req = new ActivityRequest();
        req.setTitle("Museum Visit Paid");
        req.setCost(75.0);

        ActivityResponse resp = activityService.updateActivity(500L, req, 1L);

        assertNotNull(resp);
        assertEquals(888L, act.getLinkedExpenseId());
        verify(expenseService).createExpense(any(), eq(1L));
    }

    @Test
    void testDeleteActivity_RemovesLinkedExpense() {
        Activity act = new Activity();
        act.setId(500L);
        act.setTitle("Museum Visit");
        act.setLinkedExpenseId(999L);
        act.setItinerary(itinerary);
        act.setUser(owner);

        when(activityRepository.findById(500L)).thenReturn(Optional.of(act));

        com.tripnest.entity.Expense exp = new com.tripnest.entity.Expense();
        exp.setId(999L);
        when(expenseRepository.findById(999L)).thenReturn(Optional.of(exp));

        activityService.deleteActivity(500L, 1L);

        verify(expenseRepository).delete(exp);
        verify(activityRepository).delete(act);
    }
}
