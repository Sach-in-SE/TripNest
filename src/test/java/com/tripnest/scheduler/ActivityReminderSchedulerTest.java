package com.tripnest.scheduler;

import com.tripnest.entity.Activity;
import com.tripnest.entity.ActivityReminder;
import com.tripnest.entity.Itinerary;
import com.tripnest.entity.NotificationPreference;
import com.tripnest.entity.Trip;
import com.tripnest.entity.User;
import com.tripnest.repository.ActivityRepository;
import com.tripnest.repository.NotificationPreferenceRepository;
import com.tripnest.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ActivityReminderSchedulerTest {

    @Mock
    private ActivityRepository activityRepository;

    @Mock
    private NotificationPreferenceRepository notificationPreferenceRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private ActivityReminderScheduler activityReminderScheduler;

    private User testUser;
    private Trip testTrip;
    private Itinerary testItinerary;
    private Activity testActivity;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setUsername("testuser");

        // Default: no notification preferences set (reminders enabled by default)
        when(notificationPreferenceRepository.findByUserId(1L)).thenReturn(Optional.empty());

        testTrip = new Trip();
        testTrip.setId(1L);
        testTrip.setTitle("Test Trip");
        testTrip.setUser(testUser);

        testItinerary = new Itinerary();
        testItinerary.setId(1L);
        testItinerary.setDate(LocalDate.now());
        testItinerary.setTrip(testTrip);

        testActivity = new Activity();
        testActivity.setId(1L);
        testActivity.setTitle("Test Activity");
        testActivity.setReminderSent(false);
        testActivity.setItinerary(testItinerary);
    }

    @Test
    void testSendConfigurableActivityReminders_With30MinuteReminder_SendsNotification() {
        testActivity.setStartTime(LocalTime.now().plusMinutes(30));
        testActivity.setReminder(ActivityReminder.THIRTY_MINUTES);

        when(activityRepository.findByItinerary_Date(LocalDate.now())).thenReturn(Arrays.asList(testActivity));

        activityReminderScheduler.sendConfigurableActivityReminders();

        verify(activityRepository).save(testActivity);
        assertTrue(testActivity.getReminderSent());
    }

    @Test
    void testSendConfigurableActivityReminders_With1HourReminder_SendsNotification() {
        testActivity.setStartTime(LocalTime.now().plusHours(1));
        testActivity.setReminder(ActivityReminder.ONE_HOUR);

        when(activityRepository.findByItinerary_Date(LocalDate.now())).thenReturn(Arrays.asList(testActivity));

        activityReminderScheduler.sendConfigurableActivityReminders();

        verify(activityRepository).save(testActivity);
        assertTrue(testActivity.getReminderSent());
    }

    @Test
    void testSendConfigurableActivityReminders_With2HoursReminder_SendsNotification() {
        testActivity.setStartTime(LocalTime.now().plusHours(2));
        testActivity.setReminder(ActivityReminder.TWO_HOURS);

        when(activityRepository.findByItinerary_Date(LocalDate.now())).thenReturn(Arrays.asList(testActivity));

        activityReminderScheduler.sendConfigurableActivityReminders();

        verify(activityRepository).save(testActivity);
        assertTrue(testActivity.getReminderSent());
    }

    @Test
    void testSendConfigurableActivityReminders_WithNoReminder_DoesNotSendNotification() {
        testActivity.setReminder(ActivityReminder.NONE);

        when(activityRepository.findByItinerary_Date(LocalDate.now())).thenReturn(Arrays.asList(testActivity));

        activityReminderScheduler.sendConfigurableActivityReminders();

        verify(activityRepository, never()).save(testActivity);
    }

    @Test
    void testSendConfigurableActivityReminders_WhenAlreadySent_DoesNotSendAgain() {
        testActivity.setReminderSent(true);
        testActivity.setReminder(ActivityReminder.THIRTY_MINUTES);

        when(activityRepository.findByItinerary_Date(LocalDate.now())).thenReturn(Arrays.asList(testActivity));

        activityReminderScheduler.sendConfigurableActivityReminders();

        verify(activityRepository, never()).save(testActivity);
    }

    @Test
    void testSendConfigurableActivityReminders_WithPastStartTime_DoesNotSendNotification() {
        testActivity.setStartTime(LocalTime.now().minusHours(1));
        testActivity.setReminder(ActivityReminder.THIRTY_MINUTES);

        when(activityRepository.findByItinerary_Date(LocalDate.now())).thenReturn(Arrays.asList(testActivity));

        activityReminderScheduler.sendConfigurableActivityReminders();

        verify(activityRepository, never()).save(testActivity);
    }

    @Test
    void testSendDailyActivityReminders_With1DayReminder_SendsNotification() {
        testActivity.setReminder(ActivityReminder.ONE_DAY);
        testActivity.setReminderSent(false);

        when(activityRepository.findByItinerary_Date(LocalDate.now().plusDays(1))).thenReturn(Arrays.asList(testActivity));

        activityReminderScheduler.sendDailyActivityReminders();

        verify(activityRepository).save(testActivity);
        assertTrue(testActivity.getReminderSent());
    }

    @Test
    void testDefaultReminder_Is30Minutes() {
        Activity activity = new Activity();
        assertEquals(ActivityReminder.THIRTY_MINUTES, activity.getReminder());
    }

    @Test
    void testActivityRemindersDisabled_DoesNotSendNotification() {
        testActivity.setStartTime(LocalTime.now().plusMinutes(30));
        testActivity.setReminder(ActivityReminder.THIRTY_MINUTES);

        NotificationPreference preference = new NotificationPreference();
        preference.setActivityReminders(false);

        when(activityRepository.findByItinerary_Date(LocalDate.now())).thenReturn(Arrays.asList(testActivity));
        when(notificationPreferenceRepository.findByUserId(1L)).thenReturn(Optional.of(preference));

        activityReminderScheduler.sendConfigurableActivityReminders();

        verify(activityRepository, never()).save(testActivity);
    }
}