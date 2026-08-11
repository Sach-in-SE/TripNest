package com.tripnest.scheduler;

import com.tripnest.dto.NotificationRequest;
import com.tripnest.entity.Activity;
import com.tripnest.entity.ActivityReminder;
import com.tripnest.entity.NotificationPreference;
import com.tripnest.repository.ActivityRepository;
import com.tripnest.repository.NotificationPreferenceRepository;
import com.tripnest.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Component
public class ActivityReminderScheduler {

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private NotificationPreferenceRepository notificationPreferenceRepository;

    @Scheduled(fixedRate = 300000) // Check every 5 minutes for time-based reminders
    public void sendConfigurableActivityReminders() {
        LocalDate today = LocalDate.now();
        List<Activity> activitiesToday = activityRepository.findByItinerary_Date(today);

        LocalDateTime now = LocalDateTime.now();

        for (Activity activity : activitiesToday) {
            if (activity.getStartTime() == null) {
                continue;
            }

            // Skip if user has disabled activity reminders
            if (!shouldSendActivityReminder(activity.getItinerary().getTrip().getUser().getId())) {
                continue;
            }

            // Skip if no reminder is configured
            if (activity.getReminder() == ActivityReminder.NONE) {
                continue;
            }

            LocalDateTime activityDateTime = LocalDateTime.of(today, activity.getStartTime());
            long minutesUntil = java.time.Duration.between(now, activityDateTime).toMinutes();

            // Only send reminder if time has not already passed
            if (minutesUntil < 0) {
                continue;
            }

            // Check if reminder was already sent
            if (activity.getReminderSent()) {
                continue;
            }

            // Send reminder based on configured time
            boolean shouldSend = false;
            String title = "";
            String message = "";

            switch (activity.getReminder()) {
                case THIRTY_MINUTES:
                    if (minutesUntil > 25 && minutesUntil <= 35) {
                        shouldSend = true;
                        title = "Activity in 30 Minutes";
                        message = "Your activity \"" + activity.getTitle() + "\" starts in 30 minutes at " + activity.getStartTime();
                    }
                    break;
                case ONE_HOUR:
                    if (minutesUntil > 55 && minutesUntil <= 65) {
                        shouldSend = true;
                        title = "Activity in 1 Hour";
                        message = "Your activity \"" + activity.getTitle() + "\" starts in 1 hour at " + activity.getStartTime();
                    }
                    break;
                case TWO_HOURS:
                    if (minutesUntil > 115 && minutesUntil <= 125) {
                        shouldSend = true;
                        title = "Activity in 2 Hours";
                        message = "Your activity \"" + activity.getTitle() + "\" starts in 2 hours at " + activity.getStartTime();
                    }
                    break;
                case ONE_DAY:
                    // This is handled by the daily scheduler
                    break;
                case NONE:
                    break;
            }

            if (shouldSend) {
                sendActivityReminder(activity, title, message);
                activity.setReminderSent(true);
                activityRepository.save(activity);
            }
        }
    }

    @Scheduled(cron = "0 0 9 * * *") // Daily at 9 AM for 1-day reminders
    public void sendDailyActivityReminders() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        List<Activity> activitiesTomorrow = activityRepository.findByItinerary_Date(tomorrow);

        for (Activity activity : activitiesTomorrow) {
            // Skip if user has disabled activity reminders
            if (!shouldSendActivityReminder(activity.getItinerary().getTrip().getUser().getId())) {
                continue;
            }

            // Only send if 1-day reminder is configured
            if (activity.getReminder() == ActivityReminder.ONE_DAY && !activity.getReminderSent()) {
                NotificationRequest request = new NotificationRequest();
                request.setType("ACTIVITY_REMINDER");
                request.setTitle("Activity Tomorrow");
                request.setMessage("Your activity \"" + activity.getTitle() + "\" is scheduled for tomorrow at " + 
                    (activity.getStartTime() != null ? activity.getStartTime() : "the scheduled time"));
                request.setUserId(activity.getItinerary().getTrip().getUser().getId());
                request.setReferenceId(activity.getId());

                notificationService.createNotification(request);
                activity.setReminderSent(true);
                activityRepository.save(activity);
            }
        }
    }

    private boolean shouldSendActivityReminder(Long userId) {
        NotificationPreference preference = notificationPreferenceRepository.findByUserId(userId).orElse(null);
        return preference == null || preference.isActivityReminders();
    }

    private void sendActivityReminder(Activity activity, String title, String message) {
        NotificationRequest request = new NotificationRequest();
        request.setType("ACTIVITY_REMINDER");
        request.setTitle(title);
        request.setMessage(message);
        request.setUserId(activity.getItinerary().getTrip().getUser().getId());
        request.setReferenceId(activity.getId());

        notificationService.createNotification(request);
    }
}
