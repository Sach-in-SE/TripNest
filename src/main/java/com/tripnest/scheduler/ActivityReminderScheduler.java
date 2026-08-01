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
import java.util.List;

@Component
public class ActivityReminderScheduler {

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private NotificationService notificationService;

    @Scheduled(fixedRate = 900000)
    public void sendActivityReminders() {
        LocalDate today = LocalDate.now();
        List<Activity> activitiesToday = activityRepository.findByItinerary_DateAndReminderSentFalse(today);

        LocalDateTime nowDateTime = LocalDateTime.now();
        LocalDateTime windowEnd = nowDateTime.plusHours(1);

        for (Activity activity : activitiesToday) {
            if (activity.getStartTime() == null) {
                continue;
            }

            LocalDateTime activityDateTime = LocalDateTime.of(activity.getItinerary().getDate(), activity.getStartTime());

            if (!activityDateTime.isBefore(nowDateTime) && !activityDateTime.isAfter(windowEnd)) {
                NotificationRequest request = new NotificationRequest();
                request.setType("ACTIVITY_REMINDER");
                request.setTitle("Upcoming Activity");
                request.setMessage("Your activity \"" + activity.getTitle() + "\" starts at " + activity.getStartTime());
                request.setUserId(activity.getItinerary().getTrip().getUser().getId());
                request.setReferenceId(activity.getId());

                notificationService.createNotification(request);

                activity.setReminderSent(true);
                activityRepository.save(activity);
            }
        }
    }
}
