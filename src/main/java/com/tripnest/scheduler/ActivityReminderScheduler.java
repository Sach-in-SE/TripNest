package com.tripnest.scheduler;

import com.tripnest.dto.NotificationRequest;
import com.tripnest.entity.Activity;
import com.tripnest.repository.ActivityRepository;
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

    @Scheduled(cron = "0 0 9 * * *")
    public void sendDailyActivityReminders() {
        // Send reminders for activities happening tomorrow
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        List<Activity> activitiesTomorrow = activityRepository.findByItinerary_DateAndReminderSentFalse(tomorrow);

        for (Activity activity : activitiesTomorrow) {
            NotificationRequest request = new NotificationRequest();
            request.setType("ACTIVITY_REMINDER");
            request.setTitle("Activity Tomorrow");
            request.setMessage("Your activity \"" + activity.getTitle() + "\" is scheduled for tomorrow at " + 
                (activity.getStartTime() != null ? activity.getStartTime() : "the scheduled time"));
            request.setUserId(activity.getItinerary().getTrip().getUser().getId());
            request.setReferenceId(activity.getId());

            notificationService.createNotification(request);
        }
    }

    @Scheduled(fixedRate = 300000) // Check every 5 minutes for time-based reminders
    public void sendTimeBasedActivityReminders() {
        LocalDate today = LocalDate.now();
        List<Activity> activitiesToday = activityRepository.findByItinerary_Date(today);

        LocalDateTime now = LocalDateTime.now();

        for (Activity activity : activitiesToday) {
            if (activity.getStartTime() == null) {
                continue;
            }

            LocalDateTime activityDateTime = LocalDateTime.of(today, activity.getStartTime());
            long minutesUntil = java.time.Duration.between(now, activityDateTime).toMinutes();

            // 2 hours before (120 minutes)
            if (minutesUntil > 115 && minutesUntil <= 125) {
                sendActivityReminder(activity, "Activity in 2 Hours", 
                    "Your activity \"" + activity.getTitle() + "\" starts in 2 hours at " + activity.getStartTime());
            }
            // 30 minutes before
            else if (minutesUntil > 25 && minutesUntil <= 35) {
                sendActivityReminder(activity, "Activity in 30 Minutes", 
                    "Your activity \"" + activity.getTitle() + "\" starts in 30 minutes at " + activity.getStartTime());
            }
        }
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
