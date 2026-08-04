package com.tripnest.scheduler;

import com.tripnest.dto.NotificationRequest;
import com.tripnest.entity.Trip;
import com.tripnest.repository.TripRepository;
import com.tripnest.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class TripReminderScheduler {

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private NotificationService notificationService;

    @Scheduled(cron = "0 0 9 * * *")
    public void sendTripReminders() {
        LocalDate today = LocalDate.now();
        
        // 7 days before
        LocalDate sevenDaysBefore = today.plusDays(7);
        sendTripReminder(sevenDaysBefore, "Trip Starting in 7 Days", "Your trip to %s (%s) starts in 7 days!", 7);
        
        // 3 days before
        LocalDate threeDaysBefore = today.plusDays(3);
        sendTripReminder(threeDaysBefore, "Trip Starting in 3 Days", "Your trip to %s (%s) starts in 3 days!", 3);
        
        // 1 day before
        LocalDate oneDayBefore = today.plusDays(1);
        sendTripReminder(oneDayBefore, "Trip Starting Tomorrow!", "Your trip to %s (%s) starts tomorrow!", 1);
        
        // Same day
        sendTripReminder(today, "Trip Starts Today!", "Your trip to %s (%s) starts today!", 0);
    }

    private void sendTripReminder(LocalDate date, String title, String messageTemplate, int daysBefore) {
        List<Trip> trips = tripRepository.findByStartDateAndReminderSentFalse(date);
        
        for (Trip trip : trips) {
            // Check if reminder was already sent for this specific time period
            // For simplicity, we'll use a flag-based approach, but in production you'd want separate flags
            if (trip.getReminderSent()) {
                continue;
            }

            NotificationRequest request = new NotificationRequest();
            request.setType("TRIP_REMINDER");
            request.setTitle(title);
            request.setMessage(String.format(messageTemplate, trip.getDestination(), trip.getTitle()));
            request.setUserId(trip.getUser().getId());
            request.setReferenceId(trip.getId());

            notificationService.createNotification(request);

            // For simplicity, we mark as sent after the 1-day reminder
            // In production, you'd want separate flags for each reminder period
            if (daysBefore <= 1) {
                trip.setReminderSent(true);
                tripRepository.save(trip);
            }
        }
    }
}
