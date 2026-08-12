package com.tripnest.service;

import com.tripnest.entity.Trip;
import com.tripnest.entity.User;
import com.tripnest.entity.TravelGroup;
import com.tripnest.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TripServiceTest {

    @Mock
    private TripRepository tripRepository;

    @Mock
    private ItineraryRepository itineraryRepository;

    @Mock
    private ActivityRepository activityRepository;

    @Mock
    private TripShareRepository tripShareRepository;

    @Mock
    private BudgetRepository budgetRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private GroupRepository groupRepository;

    @Mock
    private GroupMemberRepository groupMemberRepository;

    @Mock
    private GroupMessageRepository groupMessageRepository;

    @InjectMocks
    private TripService tripService;

    private User owner;
    private Trip trip;
    private TravelGroup group;

    @BeforeEach
    void setUp() {
        owner = new User();
        owner.setId(1L);

        trip = new Trip();
        trip.setId(10L);
        trip.setUser(owner);

        group = new TravelGroup();
        group.setId(100L);
        group.setTrip(trip);
    }

    @Test
    void testDeleteTrip_Success_DeletesGroupMembersBeforeGroups() {
        when(tripRepository.findById(10L)).thenReturn(Optional.of(trip));
        when(itineraryRepository.findByTripIdOrderByDateAsc(10L)).thenReturn(Collections.emptyList());
        when(tripShareRepository.findByTripId(10L)).thenReturn(Collections.emptyList());
        when(budgetRepository.findByTripId(10L)).thenReturn(Optional.empty());
        when(expenseRepository.findByTripId(10L)).thenReturn(Collections.emptyList());
        when(documentRepository.findByTripId(10L)).thenReturn(Collections.emptyList());
        when(groupRepository.findByTripId(10L)).thenReturn(List.of(group));

        tripService.deleteTrip(10L, 1L);

        verify(groupMessageRepository).deleteByTravelGroupId(100L);
        verify(groupMemberRepository).deleteByTravelGroupId(100L);
        verify(groupRepository).deleteAll(List.of(group));
        verify(tripRepository).delete(trip);
    }

    @Test
    void testDeleteTrip_UnauthorizedUser_ThrowsException() {
        when(tripRepository.findById(10L)).thenReturn(Optional.of(trip));

        assertThrows(RuntimeException.class, () -> {
            tripService.deleteTrip(10L, 2L);
        });

        verify(tripRepository, never()).delete(any());
    }

    @Test
    void testGetUserTrips_DeduplicatesOwnedAndSharedTrips() {
        trip.setStatus(com.tripnest.entity.TripStatus.PLANNING);
        when(tripRepository.findByUserId(1L)).thenReturn(List.of(trip));

        com.tripnest.entity.TripShare share = new com.tripnest.entity.TripShare();
        share.setId(50L);
        share.setTrip(trip);
        share.setSharedWithUser(owner);
        share.setPermission(com.tripnest.entity.SharePermission.EDIT);
        share.setStatus(com.tripnest.entity.ShareStatus.ACCEPTED);

        when(tripShareRepository.findBySharedWithUserIdAndStatus(1L, com.tripnest.entity.ShareStatus.ACCEPTED))
                .thenReturn(List.of(share));

        List<com.tripnest.dto.TripResponse> result = tripService.getUserTrips(1L);

        org.junit.jupiter.api.Assertions.assertEquals(1, result.size());
        org.junit.jupiter.api.Assertions.assertEquals(10L, result.get(0).getId());
        org.junit.jupiter.api.Assertions.assertEquals("OWNER", result.get(0).getPermission());
    }
}
