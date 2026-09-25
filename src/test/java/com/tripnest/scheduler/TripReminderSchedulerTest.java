package com.tripnest.scheduler;

import com.tripnest.dto.NotificationRequest;
import com.tripnest.entity.NotificationPreference;
import com.tripnest.entity.NotificationType;
import com.tripnest.entity.Trip;
import com.tripnest.entity.TripStatus;
import com.tripnest.entity.User;
import com.tripnest.entity.ShareStatus;
import com.tripnest.entity.TravelGroup;
import com.tripnest.entity.TripShare;
import com.tripnest.repository.GroupRepository;
import com.tripnest.repository.NotificationPreferenceRepository;
import com.tripnest.repository.NotificationRepository;
import com.tripnest.repository.TripRepository;
import com.tripnest.repository.TripShareRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TripReminderSchedulerTest {

    @Mock
    private TripRepository tripRepository;

    @Mock
    private com.tripnest.service.NotificationService notificationService;

    @Mock
    private NotificationPreferenceRepository notificationPreferenceRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private TripShareRepository tripShareRepository;

    @Mock
    private GroupRepository groupRepository;

    @InjectMocks
    private TripReminderScheduler tripReminderScheduler;

    private User testUser;
    private Trip testTrip;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setUsername("testuser");

        testTrip = new Trip();
        testTrip.setId(1L);
        testTrip.setTitle("Test Trip");
        testTrip.setDestination("Paris");
        testTrip.setUser(testUser);
        testTrip.setStatus(TripStatus.PLANNING);

        // Default: no notification preferences set (reminders enabled by default)
        when(notificationPreferenceRepository.findByUserId(anyLong())).thenReturn(Optional.empty());
        // Default: no duplicate notifications exist
        when(notificationRepository.existsByUserIdAndTypeAndTitleAndReferenceId(any(), any(), any(), any())).thenReturn(false);
    }

    @Test
    void testSend7DayReminder_WhenTripStartsIn7Days_SendsNotification() {
        LocalDate today = LocalDate.now();
        LocalDate sevenDaysFromNow = today.plusDays(7);
        testTrip.setStartDate(sevenDaysFromNow);
        testTrip.setReminder7DaySent(false);

        when(tripRepository.findByStartDate(sevenDaysFromNow)).thenReturn(Arrays.asList(testTrip));

        tripReminderScheduler.send7DayReminder(today);

        verify(notificationService).createNotification(any(NotificationRequest.class));
        verify(tripRepository).save(testTrip);
        assertTrue(testTrip.getReminder7DaySent());
    }

    @Test
    void testSend7DayReminder_WhenAlreadySent_DoesNotSendAgain() {
        LocalDate today = LocalDate.now();
        LocalDate sevenDaysFromNow = today.plusDays(7);
        testTrip.setStartDate(sevenDaysFromNow);
        testTrip.setReminder7DaySent(true);

        when(tripRepository.findByStartDate(sevenDaysFromNow)).thenReturn(Arrays.asList(testTrip));

        tripReminderScheduler.send7DayReminder(today);

        verify(notificationService, never()).createNotification(any(NotificationRequest.class));
        verify(tripRepository, never()).save(testTrip);
    }

    @Test
    void testSend3DayReminder_WhenTripStartsIn3Days_SendsNotification() {
        LocalDate today = LocalDate.now();
        LocalDate threeDaysFromNow = today.plusDays(3);
        testTrip.setStartDate(threeDaysFromNow);
        testTrip.setReminder3DaySent(false);

        when(tripRepository.findByStartDate(threeDaysFromNow)).thenReturn(Arrays.asList(testTrip));

        tripReminderScheduler.send3DayReminder(today);

        verify(notificationService).createNotification(any(NotificationRequest.class));
        verify(tripRepository).save(testTrip);
        assertTrue(testTrip.getReminder3DaySent());
    }

    @Test
    void testSend24HourReminder_WhenTripStartsTomorrow_SendsNotification() {
        LocalDate today = LocalDate.now();
        LocalDate tomorrow = today.plusDays(1);
        testTrip.setStartDate(tomorrow);
        testTrip.setReminder24HourSent(false);

        when(tripRepository.findByStartDate(tomorrow)).thenReturn(Arrays.asList(testTrip));

        tripReminderScheduler.send24HourReminder(today);

        verify(notificationService).createNotification(any(NotificationRequest.class));
        verify(tripRepository).save(testTrip);
        assertTrue(testTrip.getReminder24HourSent());
    }

    @Test
    void testSendTripStartedNotification_WhenTripStartsToday_SendsNotification() {
        LocalDate today = LocalDate.now();
        testTrip.setStartDate(today);
        testTrip.setTripStartedSent(false);

        when(tripRepository.findByStartDate(today)).thenReturn(Arrays.asList(testTrip));

        tripReminderScheduler.sendTripStartedNotification(today);

        verify(notificationService).createNotification(any(NotificationRequest.class));
        verify(tripRepository).save(testTrip);
        assertTrue(testTrip.getTripStartedSent());
    }

    @Test
    void testSendTripStartedNotification_WhenOngoingTrip_SendsNotificationOnce() {
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);
        LocalDate tomorrow = today.plusDays(1);
        testTrip.setStartDate(yesterday);
        testTrip.setEndDate(tomorrow);
        testTrip.setTripStartedSent(false);

        when(tripRepository.findByStartDateBeforeAndEndDateAfter(today, today))
                .thenReturn(Arrays.asList(testTrip));

        tripReminderScheduler.sendTripStartedNotification(today);

        verify(notificationService).createNotification(any(NotificationRequest.class));
        verify(tripRepository).save(testTrip);
        assertTrue(testTrip.getTripStartedSent());
    }

    @Test
    void testSendTripCompletedNotification_WhenTripEndedYesterday_SendsNotification() {
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);
        testTrip.setEndDate(yesterday);
        testTrip.setTripCompletedSent(false);

        when(tripRepository.findByEndDate(yesterday)).thenReturn(Arrays.asList(testTrip));

        tripReminderScheduler.sendTripCompletedNotification(today);

        verify(notificationService).createNotification(any(NotificationRequest.class));
        verify(tripRepository).save(testTrip);
        assertTrue(testTrip.getTripCompletedSent());
    }

    @Test
    void testDuplicatePrevention_WhenNotificationExists_DoesNotCreateDuplicate() {
        LocalDate today = LocalDate.now();
        LocalDate sevenDaysFromNow = today.plusDays(7);
        testTrip.setStartDate(sevenDaysFromNow);
        testTrip.setReminder7DaySent(false);

        when(tripRepository.findByStartDate(sevenDaysFromNow)).thenReturn(Arrays.asList(testTrip));
        when(notificationRepository.existsByUserIdAndTypeAndTitleAndReferenceId(1L, NotificationType.TRIP_REMINDER, "Trip Coming Up in 7 Days", 1L))
                .thenReturn(true);

        tripReminderScheduler.send7DayReminder(today);

        verify(notificationService, never()).createNotification(any(NotificationRequest.class));
        verify(tripRepository).save(testTrip); // Should still save to mark as sent
        assertTrue(testTrip.getReminder7DaySent());
    }

    @Test
    void testMultiStageReminders_AllowsDifferentStagesForSameTrip() {
        LocalDate today = LocalDate.now();
        LocalDate threeDaysFromNow = today.plusDays(3);
        testTrip.setStartDate(threeDaysFromNow);
        testTrip.setReminder3DaySent(false);

        // 7-day reminder notification exists in DB, but 3-day reminder notification does NOT exist
        when(notificationRepository.existsByUserIdAndTypeAndTitleAndReferenceId(1L, NotificationType.TRIP_REMINDER, "Trip Coming Up in 7 Days", 1L))
                .thenReturn(true);
        when(notificationRepository.existsByUserIdAndTypeAndTitleAndReferenceId(1L, NotificationType.TRIP_REMINDER, "Trip Coming Up in 3 Days", 1L))
                .thenReturn(false);

        when(tripRepository.findByStartDate(threeDaysFromNow)).thenReturn(Arrays.asList(testTrip));

        tripReminderScheduler.send3DayReminder(today);

        verify(notificationService).createNotification(any(NotificationRequest.class));
        verify(tripRepository).save(testTrip);
        assertTrue(testTrip.getReminder3DaySent());
    }

    @Test
    void testNoRemindersForPastTrips() {
        LocalDate today = LocalDate.now();
        LocalDate pastDate = today.minusDays(10);
        testTrip.setStartDate(pastDate);

        when(tripRepository.findByStartDate(any())).thenReturn(Collections.emptyList());

        tripReminderScheduler.send7DayReminder(today);
        tripReminderScheduler.send3DayReminder(today);
        tripReminderScheduler.send24HourReminder(today);

        verify(notificationService, never()).createNotification(any(NotificationRequest.class));
    }

    @Test
    void testTripRemindersDisabled_DoesNotSendNotification() {
        LocalDate today = LocalDate.now();
        LocalDate sevenDaysFromNow = today.plusDays(7);
        testTrip.setStartDate(sevenDaysFromNow);
        testTrip.setReminder7DaySent(false);

        NotificationPreference preference = new NotificationPreference();
        preference.setTripReminders(false);

        when(tripRepository.findByStartDate(sevenDaysFromNow)).thenReturn(Arrays.asList(testTrip));
        when(notificationPreferenceRepository.findByUserId(1L)).thenReturn(Optional.of(preference));

        tripReminderScheduler.send7DayReminder(today);

        verify(notificationService, never()).createNotification(any(NotificationRequest.class));
        verify(tripRepository, never()).save(testTrip);
    }

    @Test
    void testSend7DayReminder_SendsNotificationToCollaboratorsAndGroupMembers() {
        LocalDate today = LocalDate.now();
        LocalDate sevenDaysFromNow = today.plusDays(7);
        testTrip.setStartDate(sevenDaysFromNow);
        testTrip.setReminder7DaySent(false);

        User collaborator = new User();
        collaborator.setId(2L);
        TripShare share = new TripShare();
        share.setSharedWithUser(collaborator);
        share.setStatus(ShareStatus.ACCEPTED);

        User member = new User();
        member.setId(3L);
        TravelGroup group = new TravelGroup();
        group.setMembers(Collections.singleton(member));

        when(tripRepository.findByStartDate(sevenDaysFromNow)).thenReturn(Arrays.asList(testTrip));
        when(tripShareRepository.findByTripIdAndStatus(1L, ShareStatus.ACCEPTED)).thenReturn(Arrays.asList(share));
        when(groupRepository.findByTripIdWithDetails(1L)).thenReturn(Arrays.asList(group));

        tripReminderScheduler.send7DayReminder(today);

        // Should notify owner (1L), collaborator (2L), and group member (3L)
        verify(notificationService, times(3)).createNotification(any(NotificationRequest.class));
        verify(tripRepository).save(testTrip);
        assertTrue(testTrip.getReminder7DaySent());
    }

    @Test
    void testSend7DayReminder_FallbackToFindByTripIdWhenWithDetailsEmpty() {
        LocalDate today = LocalDate.now();
        LocalDate sevenDaysFromNow = today.plusDays(7);
        testTrip.setStartDate(sevenDaysFromNow);
        testTrip.setReminder7DaySent(false);

        User member = new User();
        member.setId(4L);
        TravelGroup group = new TravelGroup();
        group.setMembers(Collections.singleton(member));

        when(tripRepository.findByStartDate(sevenDaysFromNow)).thenReturn(Arrays.asList(testTrip));
        when(tripShareRepository.findByTripIdAndStatus(1L, ShareStatus.ACCEPTED)).thenReturn(Collections.emptyList());
        when(groupRepository.findByTripIdWithDetails(1L)).thenReturn(Collections.emptyList());
        when(groupRepository.findByTripId(1L)).thenReturn(Arrays.asList(group));

        tripReminderScheduler.send7DayReminder(today);

        // Should notify owner (1L) and group member (4L)
        verify(notificationService, times(2)).createNotification(any(NotificationRequest.class));
        verify(tripRepository).save(testTrip);
        assertTrue(testTrip.getReminder7DaySent());
    }
}