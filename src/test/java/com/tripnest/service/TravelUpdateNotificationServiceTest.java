package com.tripnest.service;

import com.tripnest.entity.Notification;
import com.tripnest.entity.NotificationType;
import com.tripnest.entity.SharePermission;
import com.tripnest.entity.ShareStatus;
import com.tripnest.entity.Trip;
import com.tripnest.entity.TripShare;
import com.tripnest.entity.User;
import com.tripnest.repository.NotificationRepository;
import com.tripnest.repository.TripRepository;
import com.tripnest.repository.TripShareRepository;
import com.tripnest.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TravelUpdateNotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private TripShareRepository tripShareRepository;

    @Mock
    private TripRepository tripRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private TravelUpdateNotificationService travelUpdateNotificationService;

    private User owner;
    private User editor;
    private User viewer;
    private Trip testTrip;

    @BeforeEach
    void setUp() {
        owner = new User();
        owner.setId(1L);
        owner.setEmail("owner@example.com");
        owner.setUsername("owner");

        editor = new User();
        editor.setId(2L);
        editor.setEmail("editor@example.com");
        editor.setUsername("editor");

        viewer = new User();
        viewer.setId(3L);
        viewer.setEmail("viewer@example.com");
        viewer.setUsername("viewer");

        testTrip = new Trip();
        testTrip.setId(1L);
        testTrip.setTitle("Test Trip");
        testTrip.setUser(owner);

        // Default: users can be found by ID
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        when(userRepository.findById(2L)).thenReturn(Optional.of(editor));
        when(userRepository.findById(3L)).thenReturn(Optional.of(viewer));
    }

    @Test
    void testNotifyTripDetailsUpdated_OwnerNotifiesMembers() {
        TripShare editorShare = createTripShare(editor, SharePermission.EDIT);
        TripShare viewerShare = createTripShare(viewer, SharePermission.VIEW);

        when(tripRepository.findById(1L)).thenReturn(Optional.of(testTrip));
        when(tripShareRepository.findByTripId(1L)).thenReturn(Arrays.asList(editorShare, viewerShare));
        // No duplicates for any recipient
        when(notificationRepository.existsByUserIdAndTypeAndTitleAndMessageAndReferenceId(any(), any(), any(), any(), any())).thenReturn(false);

        travelUpdateNotificationService.notifyTripDetailsUpdated(1L, 1L);

        verify(notificationRepository, times(2)).save(any(Notification.class));
        verify(notificationRepository, never()).save(argThat(notif -> notif.getUser().getId().equals(1L)));
    }

    @Test
    void testNotifyTripDetailsUpdated_EditorNotifiesOwnerAndOtherMembers() {
        TripShare editorShare = createTripShare(editor, SharePermission.EDIT);
        TripShare viewerShare = createTripShare(viewer, SharePermission.VIEW);

        when(tripRepository.findById(1L)).thenReturn(Optional.of(testTrip));
        when(tripShareRepository.findByTripId(1L)).thenReturn(Arrays.asList(editorShare, viewerShare));
        when(notificationRepository.existsByUserIdAndTypeAndTitleAndMessageAndReferenceId(any(), any(), any(), any(), any())).thenReturn(false);

        travelUpdateNotificationService.notifyTripDetailsUpdated(1L, 2L);

        verify(notificationRepository, times(2)).save(any(Notification.class));
        verify(notificationRepository, never()).save(argThat(notif -> notif.getUser().getId().equals(2L)));
    }

    @Test
    void testNotifyActivityAdded_OwnerNotifiesMembers() {
        TripShare editorShare = createTripShare(editor, SharePermission.EDIT);

        when(tripRepository.findById(1L)).thenReturn(Optional.of(testTrip));
        when(tripShareRepository.findByTripId(1L)).thenReturn(Arrays.asList(editorShare));
        when(notificationRepository.existsByUserIdAndTypeAndTitleAndMessageAndReferenceId(any(), any(), any(), any(), any())).thenReturn(false);

        travelUpdateNotificationService.notifyActivityAdded(1L, "Test Activity", 1L);

        verify(notificationRepository).save(argThat(notif -> 
            notif.getUser().getId().equals(2L) && 
            notif.getMessage().contains("Test Activity")
        ));
    }

    @Test
    void testNotifyActivityUpdated_OwnerNotifiesMembers() {
        TripShare editorShare = createTripShare(editor, SharePermission.EDIT);

        when(tripRepository.findById(1L)).thenReturn(Optional.of(testTrip));
        when(tripShareRepository.findByTripId(1L)).thenReturn(Arrays.asList(editorShare));
        when(notificationRepository.existsByUserIdAndTypeAndTitleAndMessageAndReferenceId(any(), any(), any(), any(), any())).thenReturn(false);

        travelUpdateNotificationService.notifyActivityUpdated(1L, "Test Activity", 1L);

        verify(notificationRepository).save(argThat(notif -> 
            notif.getUser().getId().equals(2L) && 
            notif.getMessage().contains("Test Activity")
        ));
    }

    @Test
    void testNotifyActivityDeleted_OwnerNotifiesMembers() {
        TripShare editorShare = createTripShare(editor, SharePermission.EDIT);

        when(tripRepository.findById(1L)).thenReturn(Optional.of(testTrip));
        when(tripShareRepository.findByTripId(1L)).thenReturn(Arrays.asList(editorShare));
        when(notificationRepository.existsByUserIdAndTypeAndTitleAndMessageAndReferenceId(any(), any(), any(), any(), any())).thenReturn(false);

        travelUpdateNotificationService.notifyActivityDeleted(1L, "Test Activity", 1L);

        verify(notificationRepository).save(argThat(notif -> 
            notif.getUser().getId().equals(2L) && 
            notif.getMessage().contains("Test Activity")
        ));
    }

    @Test
    void testNotifyItineraryUpdated_OwnerNotifiesMembers() {
        TripShare editorShare = createTripShare(editor, SharePermission.EDIT);

        when(tripRepository.findById(1L)).thenReturn(Optional.of(testTrip));
        when(tripShareRepository.findByTripId(1L)).thenReturn(Arrays.asList(editorShare));
        when(notificationRepository.existsByUserIdAndTypeAndTitleAndMessageAndReferenceId(any(), any(), any(), any(), any())).thenReturn(false);

        travelUpdateNotificationService.notifyItineraryUpdated(1L, 1L);

        verify(notificationRepository).save(argThat(notif -> 
            notif.getUser().getId().equals(2L) && 
            notif.getMessage().contains("itinerary")
        ));
    }

    @Test
    void testNotifyBudgetUpdated_OwnerNotifiesMembers() {
        TripShare editorShare = createTripShare(editor, SharePermission.EDIT);

        when(tripRepository.findById(1L)).thenReturn(Optional.of(testTrip));
        when(tripShareRepository.findByTripId(1L)).thenReturn(Arrays.asList(editorShare));
        when(notificationRepository.existsByUserIdAndTypeAndTitleAndMessageAndReferenceId(any(), any(), any(), any(), any())).thenReturn(false);

        travelUpdateNotificationService.notifyBudgetUpdated(1L, 1L);

        verify(notificationRepository).save(argThat(notif -> 
            notif.getUser().getId().equals(2L) && 
            notif.getMessage().contains("budget")
        ));
    }

    @Test
    void testNotifyPermissionChanged_NotifiesOnlyAffectedMember() {
        when(tripRepository.findById(1L)).thenReturn(Optional.of(testTrip));
        when(notificationRepository.existsByUserIdAndTypeAndTitleAndMessageAndReferenceId(any(), any(), any(), any(), any())).thenReturn(false);

        travelUpdateNotificationService.notifyPermissionChanged(1L, 2L, SharePermission.EDIT);

        verify(notificationRepository).save(argThat(notif -> 
            notif.getUser().getId().equals(2L) && 
            notif.getMessage().contains("EDIT")
        ));
    }

    @Test
    void testNotifyMemberRemoved_NotifiesOnlyRemovedMember() {
        when(tripRepository.findById(1L)).thenReturn(Optional.of(testTrip));
        when(notificationRepository.existsByUserIdAndTypeAndTitleAndMessageAndReferenceId(any(), any(), any(), any(), any())).thenReturn(false);

        travelUpdateNotificationService.notifyMemberRemoved(1L, 2L);

        verify(notificationRepository).save(argThat(notif -> 
            notif.getUser().getId().equals(2L) && 
            notif.getMessage().contains("removed")
        ));
    }

    @Test
    void testNotifyOwnershipTransferred_NotifiesBothOwners() {
        when(tripRepository.findById(1L)).thenReturn(Optional.of(testTrip));
        when(notificationRepository.existsByUserIdAndTypeAndTitleAndMessageAndReferenceId(any(), any(), any(), any(), any())).thenReturn(false);

        travelUpdateNotificationService.notifyOwnershipTransferred(1L, 1L, 2L);

        verify(notificationRepository, times(2)).save(any(Notification.class));
    }

    @Test
    void testDuplicatePrevention_WhenNotificationExists_DoesNotCreateDuplicate() {
        TripShare editorShare = createTripShare(editor, SharePermission.EDIT);

        when(tripRepository.findById(1L)).thenReturn(Optional.of(testTrip));
        when(tripShareRepository.findByTripId(1L)).thenReturn(Arrays.asList(editorShare));
        // Override default to simulate existing notification for the editor
        when(notificationRepository.existsByUserIdAndTypeAndTitleAndMessageAndReferenceId(eq(2L), eq(NotificationType.TRAVEL_UPDATE), anyString(), anyString(), eq(1L)))
                .thenReturn(true);

        travelUpdateNotificationService.notifyTripDetailsUpdated(1L, 1L);

        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void testNoShares_NoNotificationsSent() {
        when(tripRepository.findById(1L)).thenReturn(Optional.of(testTrip));
        when(tripShareRepository.findByTripId(1L)).thenReturn(Collections.emptyList());

        travelUpdateNotificationService.notifyTripDetailsUpdated(1L, 1L);

        verify(notificationRepository, never()).save(any(Notification.class));
    }

    private TripShare createTripShare(User user, SharePermission permission) {
        TripShare share = new TripShare();
        share.setTrip(testTrip);
        share.setSharedWithUser(user);
        share.setSharedByUser(owner);
        share.setPermission(permission);
        share.setStatus(ShareStatus.ACCEPTED);
        return share;
    }
}