package com.tripnest.service;

import com.tripnest.dto.ItineraryRequest;
import com.tripnest.dto.ItineraryResponse;
import com.tripnest.entity.Itinerary;
import com.tripnest.entity.Trip;
import com.tripnest.entity.User;
import com.tripnest.repository.ActivityRepository;
import com.tripnest.repository.ExpenseRepository;
import com.tripnest.repository.ItineraryRepository;
import com.tripnest.repository.TripRepository;
import com.tripnest.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ItineraryServiceTest {

    @Mock
    private ItineraryRepository itineraryRepository;

    @Mock
    private TripRepository tripRepository;

    @Mock
    private ActivityRepository activityRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TripShareService tripShareService;

    @Mock
    private TripTimelineValidator tripTimelineValidator;

    @Mock
    private TravelUpdateNotificationService travelUpdateNotificationService;

    @InjectMocks
    private ItineraryService itineraryService;

    private User owner;
    private Trip trip;

    @BeforeEach
    void setUp() {
        owner = new User();
        owner.setId(1L);
        owner.setUsername("jane_doe");

        trip = new Trip();
        trip.setId(10L);
        trip.setUser(owner);
    }

    @Test
    void testCreateItinerary_StoresAuthenticatedUserAsCreator_And_ReturnsCreatorInfo() {
        ItineraryRequest request = new ItineraryRequest();
        request.setTripId(10L);
        request.setDate(LocalDate.now());
        request.setNotes("Day 1 sightseeing");

        when(tripTimelineValidator.getTripForValidation(10L)).thenReturn(trip);
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        when(itineraryRepository.save(any(Itinerary.class))).thenAnswer(i -> {
            Itinerary it = i.getArgument(0);
            it.setId(100L);
            return it;
        });

        ItineraryResponse response = itineraryService.createItinerary(request, 1L);

        assertNotNull(response);
        assertEquals(100L, response.getId());
        assertEquals(1L, response.getUserId());
        assertEquals("jane_doe", response.getUsername());
        verify(itineraryRepository).save(any(Itinerary.class));
    }

    @Test
    void testMapToResponse_LegacyItineraryWithoutUser_ReturnsNullUserFields() {
        Itinerary legacyItinerary = new Itinerary();
        legacyItinerary.setId(101L);
        legacyItinerary.setDate(LocalDate.now());
        legacyItinerary.setTrip(trip);
        legacyItinerary.setUser(null);

        when(tripRepository.findById(10L)).thenReturn(Optional.of(trip));
        when(itineraryRepository.findByTripIdOrderByDateAsc(10L)).thenReturn(List.of(legacyItinerary));
        when(activityRepository.findByItineraryIdOrderByStartTimeAsc(101L)).thenReturn(Collections.emptyList());

        List<ItineraryResponse> responses = itineraryService.getTripItineraries(10L, 1L);

        assertEquals(1, responses.size());
        assertNull(responses.get(0).getUserId());
        assertNull(responses.get(0).getUsername());
    }

    @Test
    void testGetTripItineraries_UnauthorizedUser_ThrowsException() {
        when(tripRepository.findById(10L)).thenReturn(Optional.of(trip));
        when(tripShareService.hasAccess(10L, 2L)).thenReturn(false);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            itineraryService.getTripItineraries(10L, 2L);
        });

        assertEquals("Unauthorized", ex.getMessage());
    }
}
