package com.tripnest.scheduler;

import com.tripnest.dto.NotificationRequest;
import com.tripnest.entity.NotificationPreference;
import com.tripnest.entity.NotificationType;
import com.tripnest.entity.ShareStatus;
import com.tripnest.entity.TravelGroup;
import com.tripnest.entity.Trip;
import com.tripnest.entity.TripShare;
import com.tripnest.entity.User;
import com.tripnest.repository.GroupRepository;
import com.tripnest.repository.NotificationPreferenceRepository;
import com.tripnest.repository.NotificationRepository;
import com.tripnest.repository.TripRepository;
import com.tripnest.repository.TripShareRepository;
import com.tripnest.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

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

    @Autowired
    private TripShareRepository tripShareRepository;

    @Autowired
    private GroupRepository groupRepository;

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

    /**
     * Gathers all eligible recipient user IDs for trip reminders:
     * - Trip owner (trip.getUser().getId())
     * - Accepted trip collaborators (via tripShareRepository.findByTripIdAndStatus)
     * - Group members associated with that trip (via groupRepository.findByTripIdWithDetails)
     */
    private Set<Long> getEligibleTripUserIds(Trip trip) {
        Set<Long> userIds = new LinkedHashSet<>();
        if (trip == null) {
            return userIds;
        }

        // 1. Trip owner
        if (trip.getUser() != null && trip.getUser().getId() != null) {
            userIds.add(trip.getUser().getId());
        }

        // 2. Accepted trip collaborators
        if (trip.getId() != null && tripShareRepository != null) {
            List<TripShare> shares = tripShareRepository.findByTripIdAndStatus(trip.getId(), ShareStatus.ACCEPTED);
            if (shares != null) {
                for (TripShare share : shares) {
                    if (share.getSharedWithUser() != null && share.getSharedWithUser().getId() != null) {
                        userIds.add(share.getSharedWithUser().getId());
                    }
                }
            }
        }

        // 3. Group members associated with this trip
        if (trip.getId() != null && groupRepository != null) {
            List<TravelGroup> groups = groupRepository.findByTripIdWithDetails(trip.getId());
            if (groups == null || groups.isEmpty()) {
                groups = groupRepository.findByTripId(trip.getId());
            }
            if (groups != null) {
                for (TravelGroup group : groups) {
                    if (group.getMembers() != null) {
                        for (User member : group.getMembers()) {
                            if (member != null && member.getId() != null) {
                                userIds.add(member.getId());
                            }
                        }
                    }
                    if (group.getCreatedBy() != null && group.getCreatedBy().getId() != null) {
                        userIds.add(group.getCreatedBy().getId());
                    }
                }
            }
        }

        return userIds;
    }

    // Package-private for testing
    void send7DayReminder(LocalDate today) {
        LocalDate sevenDaysFromNow = today.plusDays(7);
        List<Trip> trips = tripRepository.findByStartDate(sevenDaysFromNow);
        
        for (Trip trip : trips) {
            if (trip.getReminder7DaySent()) {
                continue;
            }

            Set<Long> recipientIds = getEligibleTripUserIds(trip);
            boolean anyEnabled = recipientIds.stream().anyMatch(this::shouldSendTripReminder);
            if (!anyEnabled) {
                continue;
            }

            for (Long recipientId : recipientIds) {
                if (!shouldSendTripReminder(recipientId)) {
                    continue;
                }

                if (notificationRepository.existsByUserIdAndTypeAndTitleAndReferenceId(
                        recipientId, NotificationType.TRIP_REMINDER, "Trip Coming Up in 7 Days", trip.getId())) {
                    continue;
                }

                NotificationRequest request = new NotificationRequest();
                request.setType("TRIP_REMINDER");
                request.setTitle("Trip Coming Up in 7 Days");
                request.setMessage(String.format("Your trip to %s is coming up in 7 days.", trip.getDestination()));
                request.setUserId(recipientId);
                request.setReferenceId(trip.getId());

                notificationService.createNotification(request);
            }

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

            Set<Long> recipientIds = getEligibleTripUserIds(trip);
            boolean anyEnabled = recipientIds.stream().anyMatch(this::shouldSendTripReminder);
            if (!anyEnabled) {
                continue;
            }

            for (Long recipientId : recipientIds) {
                if (!shouldSendTripReminder(recipientId)) {
                    continue;
                }

                if (notificationRepository.existsByUserIdAndTypeAndTitleAndReferenceId(
                        recipientId, NotificationType.TRIP_REMINDER, "Trip Coming Up in 3 Days", trip.getId())) {
                    continue;
                }

                NotificationRequest request = new NotificationRequest();
                request.setType("TRIP_REMINDER");
                request.setTitle("Trip Coming Up in 3 Days");
                request.setMessage(String.format("Your trip to %s is coming up in 3 days.", trip.getDestination()));
                request.setUserId(recipientId);
                request.setReferenceId(trip.getId());

                notificationService.createNotification(request);
            }

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

            Set<Long> recipientIds = getEligibleTripUserIds(trip);
            boolean anyEnabled = recipientIds.stream().anyMatch(this::shouldSendTripReminder);
            if (!anyEnabled) {
                continue;
            }

            for (Long recipientId : recipientIds) {
                if (!shouldSendTripReminder(recipientId)) {
                    continue;
                }

                if (notificationRepository.existsByUserIdAndTypeAndTitleAndReferenceId(
                        recipientId, NotificationType.TRIP_REMINDER, "Trip Starts Tomorrow", trip.getId())) {
                    continue;
                }

                NotificationRequest request = new NotificationRequest();
                request.setType("TRIP_REMINDER");
                request.setTitle("Trip Starts Tomorrow");
                request.setMessage(String.format("Your trip to %s starts tomorrow. Get ready for your journey!", trip.getDestination()));
                request.setUserId(recipientId);
                request.setReferenceId(trip.getId());

                notificationService.createNotification(request);
            }

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

            Set<Long> recipientIds = getEligibleTripUserIds(trip);
            for (Long recipientId : recipientIds) {
                if (!shouldSendTripReminder(recipientId)) {
                    continue;
                }

                if (notificationRepository.existsByUserIdAndTypeAndTitleAndReferenceId(
                        recipientId, NotificationType.TRIP_REMINDER, "Trip Started", trip.getId())) {
                    continue;
                }

                NotificationRequest request = new NotificationRequest();
                request.setType("TRIP_REMINDER");
                request.setTitle("Trip Started");
                request.setMessage(String.format("Your trip to %s has started from %s. Have a great journey!", 
                    trip.getDestination(), trip.getStartDate()));
                request.setUserId(recipientId);
                request.setReferenceId(trip.getId());

                notificationService.createNotification(request);
            }

            trip.setTripStartedSent(true);
            tripRepository.save(trip);
        }

        // Handle edge case: trip was created after start date but is still ongoing
        // Find trips that are currently ongoing but haven't sent started notification
        List<Trip> ongoingTrips = tripRepository.findByStartDateBeforeAndEndDateAfter(today, today);
        for (Trip trip : ongoingTrips) {
            if (!trip.getTripStartedSent()) {
                Set<Long> recipientIds = getEligibleTripUserIds(trip);
                for (Long recipientId : recipientIds) {
                    if (!shouldSendTripReminder(recipientId)) {
                        continue;
                    }

                    if (notificationRepository.existsByUserIdAndTypeAndTitleAndReferenceId(
                            recipientId, NotificationType.TRIP_REMINDER, "Trip Started", trip.getId())) {
                        continue;
                    }

                    NotificationRequest request = new NotificationRequest();
                    request.setType("TRIP_REMINDER");
                    request.setTitle("Trip Started");
                    request.setMessage(String.format("Your trip to %s has started from %s. Have a great journey!", 
                        trip.getDestination(), trip.getStartDate()));
                    request.setUserId(recipientId);
                    request.setReferenceId(trip.getId());

                    notificationService.createNotification(request);
                }

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

            Set<Long> recipientIds = getEligibleTripUserIds(trip);
            for (Long recipientId : recipientIds) {
                if (!shouldSendTripReminder(recipientId)) {
                    continue;
                }

                if (notificationRepository.existsByUserIdAndTypeAndTitleAndReferenceId(
                        recipientId, NotificationType.TRIP_REMINDER, "Trip Completed", trip.getId())) {
                    continue;
                }

                NotificationRequest request = new NotificationRequest();
                request.setType("TRIP_REMINDER");
                request.setTitle("Trip Completed");
                request.setMessage(String.format("Your trip to %s has been completed. You can review your expenses and trip details.", 
                    trip.getDestination()));
                request.setUserId(recipientId);
                request.setReferenceId(trip.getId());

                notificationService.createNotification(request);
            }

            trip.setTripCompletedSent(true);
            tripRepository.save(trip);
        }
    }

    private boolean shouldSendTripReminder(Long userId) {
        NotificationPreference preference = notificationPreferenceRepository.findByUserId(userId).orElse(null);
        return preference == null || preference.isTripReminders();
    }
}
