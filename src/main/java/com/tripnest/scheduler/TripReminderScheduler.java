package com.tripnest.scheduler;

import com.tripnest.dto.NotificationRequest;
import com.tripnest.entity.NotificationPreference;
import com.tripnest.entity.NotificationType;
import com.tripnest.entity.Trip;
import com.tripnest.repository.NotificationPreferenceRepository;
import com.tripnest.repository.NotificationRepository;
import com.tripnest.repository.TripRepository;
import com.tripnest.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Component
public class TripReminderScheduler {

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private NotificationPreferenceRepository notificationPreferenceRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Scheduled(cron = "0 0 9 * * *")
    @Transactional
    public void sendTripReminders() {
        LocalDate today = LocalDate.now();
        
        // 7 days before trip starts
        send7DayReminder(today);
        
        // 3 days before trip starts
        send3DayReminder(today);
        
        // 24 hours before trip starts
        send24HourReminder(today);
        
        // Trip started notification
        sendTripStartedNotification(today);
        
        // Trip completed notification
        sendTripCompletedNotification(today);
    }

    // Package-private for testing
    void send7DayReminder(LocalDate today) {
        LocalDate sevenDaysFromNow = today.plusDays(7);
        List<Trip> trips = tripRepository.findByStartDate(sevenDaysFromNow);
        
        for (Trip trip : trips) {
            if (trip.getReminder7DaySent()) {
                continue;
            }

            // Skip if user has disabled trip reminders
            if (!shouldSendTripReminder(trip.getUser().getId())) {
                continue;
            }

            // Additional duplicate prevention at database level
            if (notificationRepository.existsByUserIdAndTypeAndTitleAndReferenceId(
                trip.getUser().getId(), NotificationType.TRIP_REMINDER, "Trip Coming Up in 7 Days", trip.getId())) {
                trip.setReminder7DaySent(true);
                tripRepository.save(trip);
                continue;
            }

            NotificationRequest request = new NotificationRequest();
            request.setType("TRIP_REMINDER");
            request.setTitle("Trip Coming Up in 7 Days");
            request.setMessage(String.format("Your trip to %s is coming up in 7 days.", trip.getDestination()));
            request.setUserId(trip.getUser().getId());
            request.setReferenceId(trip.getId());

            notificationService.createNotification(request);

            trip.setReminder7DaySent(true);
            tripRepository.save(trip);
        }
    }

    // Package-private for testing
    void send3DayReminder(LocalDate today) {
        LocalDate threeDaysFromNow = today.plusDays(3);
        List<Trip> trips = tripRepository.findByStartDate(threeDaysFromNow);
        
        for (Trip trip : trips) {
            if (trip.getReminder3DaySent()) {
                continue;
            }

            // Skip if user has disabled trip reminders
            if (!shouldSendTripReminder(trip.getUser().getId())) {
                continue;
            }

            // Additional duplicate prevention at database level
            if (notificationRepository.existsByUserIdAndTypeAndTitleAndReferenceId(
                trip.getUser().getId(), NotificationType.TRIP_REMINDER, "Trip Coming Up in 3 Days", trip.getId())) {
                trip.setReminder3DaySent(true);
                tripRepository.save(trip);
                continue;
            }

            NotificationRequest request = new NotificationRequest();
            request.setType("TRIP_REMINDER");
            request.setTitle("Trip Coming Up in 3 Days");
            request.setMessage(String.format("Your trip to %s is coming up in 3 days.", trip.getDestination()));
            request.setUserId(trip.getUser().getId());
            request.setReferenceId(trip.getId());

            notificationService.createNotification(request);

            trip.setReminder3DaySent(true);
            tripRepository.save(trip);
        }
    }

    // Package-private for testing
    void send24HourReminder(LocalDate today) {
        LocalDate tomorrow = today.plusDays(1);
        List<Trip> trips = tripRepository.findByStartDate(tomorrow);
        
        for (Trip trip : trips) {
            if (trip.getReminder24HourSent()) {
                continue;
            }

            // Skip if user has disabled trip reminders
            if (!shouldSendTripReminder(trip.getUser().getId())) {
                continue;
            }

            // Additional duplicate prevention at database level
            if (notificationRepository.existsByUserIdAndTypeAndTitleAndReferenceId(
                trip.getUser().getId(), NotificationType.TRIP_REMINDER, "Trip Starts Tomorrow", trip.getId())) {
                trip.setReminder24HourSent(true);
                tripRepository.save(trip);
                continue;
            }

            NotificationRequest request = new NotificationRequest();
            request.setType("TRIP_REMINDER");
            request.setTitle("Trip Starts Tomorrow");
            request.setMessage(String.format("Your trip to %s starts tomorrow. Get ready for your journey!", trip.getDestination()));
            request.setUserId(trip.getUser().getId());
            request.setReferenceId(trip.getId());

            notificationService.createNotification(request);

            trip.setReminder24HourSent(true);
            tripRepository.save(trip);
        }
    }

    // Package-private for testing
    void sendTripStartedNotification(LocalDate today) {
        // Find trips that started today
        List<Trip> tripsStartingToday = tripRepository.findByStartDate(today);
        
        for (Trip trip : tripsStartingToday) {
            if (trip.getTripStartedSent()) {
                continue;
            }

            // Additional duplicate prevention at database level
            if (notificationRepository.existsByUserIdAndTypeAndTitleAndReferenceId(
                trip.getUser().getId(), NotificationType.TRIP_REMINDER, "Trip Started", trip.getId())) {
                trip.setTripStartedSent(true);
                tripRepository.save(trip);
                continue;
            }

            NotificationRequest request = new NotificationRequest();
            request.setType("TRIP_REMINDER");
            request.setTitle("Trip Started");
            request.setMessage(String.format("Your trip to %s has started from %s. Have a great journey!", 
                trip.getDestination(), trip.getStartDate()));
            request.setUserId(trip.getUser().getId());
            request.setReferenceId(trip.getId());

            notificationService.createNotification(request);

            trip.setTripStartedSent(true);
            tripRepository.save(trip);
        }

        // Handle edge case: trip was created after start date but is still ongoing
        // Find trips that are currently ongoing but haven't sent started notification
        List<Trip> ongoingTrips = tripRepository.findByStartDateBeforeAndEndDateAfter(today, today);
        for (Trip trip : ongoingTrips) {
            if (!trip.getTripStartedSent()) {
                // Additional duplicate prevention at database level
                if (notificationRepository.existsByUserIdAndTypeAndTitleAndReferenceId(
                    trip.getUser().getId(), NotificationType.TRIP_REMINDER, "Trip Started", trip.getId())) {
                    trip.setTripStartedSent(true);
                    tripRepository.save(trip);
                    continue;
                }

                NotificationRequest request = new NotificationRequest();
                request.setType("TRIP_REMINDER");
                request.setTitle("Trip Started");
                request.setMessage(String.format("Your trip to %s has started from %s. Have a great journey!", 
                    trip.getDestination(), trip.getStartDate()));
                request.setUserId(trip.getUser().getId());
                request.setReferenceId(trip.getId());

                notificationService.createNotification(request);

                trip.setTripStartedSent(true);
                tripRepository.save(trip);
            }
        }
    }

    // Package-private for testing
    void sendTripCompletedNotification(LocalDate today) {
        // Find trips that ended yesterday (so we notify on the day after completion)
        LocalDate yesterday = today.minusDays(1);
        List<Trip> trips = tripRepository.findByEndDate(yesterday);
        
        for (Trip trip : trips) {
            if (trip.getTripCompletedSent()) {
                continue;
            }

            // Additional duplicate prevention at database level
            if (notificationRepository.existsByUserIdAndTypeAndTitleAndReferenceId(
                trip.getUser().getId(), NotificationType.TRIP_REMINDER, "Trip Completed", trip.getId())) {
                trip.setTripCompletedSent(true);
                tripRepository.save(trip);
                continue;
            }

            NotificationRequest request = new NotificationRequest();
            request.setType("TRIP_REMINDER");
            request.setTitle("Trip Completed");
            request.setMessage(String.format("Your trip to %s has been completed. You can review your expenses and trip details.", 
                trip.getDestination()));
            request.setUserId(trip.getUser().getId());
            request.setReferenceId(trip.getId());

            notificationService.createNotification(request);

            trip.setTripCompletedSent(true);
            tripRepository.save(trip);
        }
    }

    private boolean shouldSendTripReminder(Long userId) {
        NotificationPreference preference = notificationPreferenceRepository.findByUserId(userId).orElse(null);
        return preference == null || preference.isTripReminders();
    }
}
