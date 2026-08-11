package com.tripnest.service;

import com.tripnest.entity.SharePermission;
import com.tripnest.entity.ShareStatus;
import com.tripnest.entity.Trip;
import com.tripnest.entity.TripShare;
import com.tripnest.entity.User;
import com.tripnest.repository.TripRepository;
import com.tripnest.repository.TripShareRepository;
import org.junit.jupiter.api.BeforeEach;
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
class TripShareServiceTest {

    @Mock
    private TripShareRepository tripShareRepository;

    @Mock
    private TripRepository tripRepository;

    @Mock
    private TravelUpdateNotificationService travelUpdateNotificationService;

    @InjectMocks
    private TripShareService tripShareService;

    private User owner;
    private User member;
    private Trip testTrip;
    private TripShare testShare;

    @BeforeEach
    void setUp() {
        owner = new User();
        owner.setId(1L);
        owner.setEmail("owner@example.com");
        owner.setUsername("owner");

        member = new User();
        member.setId(2L);
        member.setEmail("member@example.com");
        member.setUsername("member");

        testTrip = new Trip();
        testTrip.setId(1L);
        testTrip.setTitle("Test Trip");
        testTrip.setUser(owner);

        testShare = new TripShare();
        testShare.setId(1L);
        testShare.setTrip(testTrip);
        testShare.setSharedWithUser(member);
        testShare.setSharedByUser(owner);
        testShare.setPermission(SharePermission.VIEW);
        testShare.setStatus(ShareStatus.ACCEPTED);
    }

    @Test
    void testRemoveShare_NotifyRemovedMember() {
        when(tripRepository.findById(1L)).thenReturn(Optional.of(testTrip));
        when(tripShareRepository.findByTripIdAndSharedWithUserId(1L, 2L)).thenReturn(Optional.of(testShare));

        tripShareService.removeShare(1L, 2L, 1L);

        verify(travelUpdateNotificationService).notifyMemberRemoved(1L, 2L);
        verify(tripShareRepository).delete(testShare);
    }

    @Test
    void testRemoveShare_Unauthorized_ThrowsException() {
        when(tripRepository.findById(1L)).thenReturn(Optional.of(testTrip));

        assertThrows(RuntimeException.class, () -> {
            tripShareService.removeShare(1L, 2L, 2L);
        });

        verify(travelUpdateNotificationService, never()).notifyMemberRemoved(any(), any());
        verify(tripShareRepository, never()).delete(any());
    }

    @Test
    void testUpdatePermission_NotifyAffectedMember() {
        when(tripRepository.findById(1L)).thenReturn(Optional.of(testTrip));
        when(tripShareRepository.findByTripIdAndSharedWithUserId(1L, 2L)).thenReturn(Optional.of(testShare));
        when(tripShareRepository.save(any(TripShare.class))).thenReturn(testShare);

        tripShareService.updatePermission(1L, 2L, SharePermission.EDIT, 1L);

        verify(travelUpdateNotificationService).notifyPermissionChanged(1L, 2L, SharePermission.EDIT);
        assertEquals(SharePermission.EDIT, testShare.getPermission());
    }

    @Test
    void testUpdatePermission_SamePermission_NoNotification() {
        testShare.setPermission(SharePermission.VIEW);
        when(tripRepository.findById(1L)).thenReturn(Optional.of(testTrip));
        when(tripShareRepository.findByTripIdAndSharedWithUserId(1L, 2L)).thenReturn(Optional.of(testShare));
        when(tripShareRepository.save(any(TripShare.class))).thenReturn(testShare);

        tripShareService.updatePermission(1L, 2L, SharePermission.VIEW, 1L);

        verify(travelUpdateNotificationService, never()).notifyPermissionChanged(any(), any(), any());
    }

    @Test
    void testUpdatePermission_Unauthorized_ThrowsException() {
        when(tripRepository.findById(1L)).thenReturn(Optional.of(testTrip));

        assertThrows(RuntimeException.class, () -> {
            tripShareService.updatePermission(1L, 2L, SharePermission.EDIT, 2L);
        });

        verify(travelUpdateNotificationService, never()).notifyPermissionChanged(any(), any(), any());
    }
}