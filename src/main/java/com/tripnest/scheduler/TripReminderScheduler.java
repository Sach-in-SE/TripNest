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
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        List<Trip> tripsStartingTomorrow = tripRepository.findByStartDateAndReminderSentFalse(tomorrow);

        for (Trip trip : tripsStartingTomorrow) {
            NotificationRequest request = new NotificationRequest();
            request.setType("TRIP_REMINDER");
            request.setTitle("Trip Starting Tomorrow!");
            request.setMessage("Your trip to " + trip.getDestination() + " (" + trip.getTitle() + ") starts tomorrow!");
            request.setUserId(trip.getUser().getId());
            request.setReferenceId(trip.getId());

            notificationService.createNotification(request);

            trip.setReminderSent(true);
            tripRepository.save(trip);
        }
    }
}
