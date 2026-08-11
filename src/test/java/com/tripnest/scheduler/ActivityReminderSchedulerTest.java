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
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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
        when(activityRepository.findByItinerary_Date(any())).thenReturn(Collections.emptyList());

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
        LocalTime nowTime = LocalTime.now();
        LocalTime startTime = nowTime.plusMinutes(30);
        testActivity.setStartTime(startTime);
        testActivity.setReminder(ActivityReminder.THIRTY_MINUTES);

        LocalDate date = startTime.isBefore(nowTime) ? LocalDate.now().plusDays(1) : LocalDate.now();
        testItinerary.setDate(date);

        when(activityRepository.findByItinerary_Date(eq(date))).thenReturn(Arrays.asList(testActivity));

        activityReminderScheduler.sendConfigurableActivityReminders();

        verify(activityRepository).save(testActivity);
        assertTrue(testActivity.getReminderSent());
    }

    @Test
    void testSendConfigurableActivityReminders_With1HourReminder_SendsNotification() {
        LocalTime nowTime = LocalTime.now();
        LocalTime startTime = nowTime.plusHours(1);
        testActivity.setStartTime(startTime);
        testActivity.setReminder(ActivityReminder.ONE_HOUR);

        LocalDate date = startTime.isBefore(nowTime) ? LocalDate.now().plusDays(1) : LocalDate.now();
        testItinerary.setDate(date);

        when(activityRepository.findByItinerary_Date(eq(date))).thenReturn(Arrays.asList(testActivity));

        activityReminderScheduler.sendConfigurableActivityReminders();

        verify(activityRepository).save(testActivity);
        assertTrue(testActivity.getReminderSent());
    }

    @Test
    void testSendConfigurableActivityReminders_With2HoursReminder_SendsNotification() {
        LocalTime nowTime = LocalTime.now();
        LocalTime startTime = nowTime.plusHours(2);
        testActivity.setStartTime(startTime);
        testActivity.setReminder(ActivityReminder.TWO_HOURS);

        LocalDate date = startTime.isBefore(nowTime) ? LocalDate.now().plusDays(1) : LocalDate.now();
        testItinerary.setDate(date);

        when(activityRepository.findByItinerary_Date(eq(date))).thenReturn(Arrays.asList(testActivity));

        activityReminderScheduler.sendConfigurableActivityReminders();

        verify(activityRepository).save(testActivity);
        assertTrue(testActivity.getReminderSent());
    }

    @Test
    void testSendConfigurableActivityReminders_WithNoReminder_DoesNotSendNotification() {
        testActivity.setReminder(ActivityReminder.NONE);

        when(activityRepository.findByItinerary_Date(eq(LocalDate.now()))).thenReturn(Arrays.asList(testActivity));

        activityReminderScheduler.sendConfigurableActivityReminders();

        verify(activityRepository, never()).save(testActivity);
    }

    @Test
    void testSendConfigurableActivityReminders_WhenAlreadySent_DoesNotSendAgain() {
        testActivity.setReminderSent(true);
        testActivity.setReminder(ActivityReminder.THIRTY_MINUTES);

        when(activityRepository.findByItinerary_Date(eq(LocalDate.now()))).thenReturn(Arrays.asList(testActivity));

        activityReminderScheduler.sendConfigurableActivityReminders();

        verify(activityRepository, never()).save(testActivity);
    }
}