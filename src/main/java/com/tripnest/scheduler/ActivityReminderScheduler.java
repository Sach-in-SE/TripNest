package com.tripnest.scheduler;

import com.tripnest.dto.NotificationRequest;
import com.tripnest.entity.Activity;
import com.tripnest.entity.ActivityReminder;
import com.tripnest.entity.NotificationPreference;
import com.tripnest.entity.ShareStatus;
import com.tripnest.entity.TravelGroup;
import com.tripnest.entity.Trip;
import com.tripnest.entity.TripShare;
import com.tripnest.entity.User;
import com.tripnest.repository.ActivityRepository;
import com.tripnest.repository.GroupRepository;
import com.tripnest.repository.NotificationPreferenceRepository;
import com.tripnest.repository.TripShareRepository;
import com.tripnest.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Component
public class ActivityReminderScheduler {

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private NotificationPreferenceRepository notificationPreferenceRepository;

    @Autowired
    private TripShareRepository tripShareRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Scheduled(fixedRate = 300000) // Check every 5 minutes for time-based reminders
    @Transactional
    public void sendConfigurableActivityReminders() {
        LocalDate today = LocalDate.now();
        List<Activity> activitiesToday = new java.util.ArrayList<>(activityRepository.findByItinerary_Date(today));
        activitiesToday.addAll(activityRepository.findByItinerary_Date(today.plusDays(1)));

        LocalDateTime now = LocalDateTime.now();

        for (Activity activity : activitiesToday) {
            if (activity.getStartTime() == null || activity.getItinerary() == null || activity.getItinerary().getDate() == null) {
                continue;
            }

            // Skip if no reminder is configured
            if (activity.getReminder() == ActivityReminder.NONE) {
                continue;
            }

            // Check if reminder was already sent
            if (activity.getReminderSent()) {
                continue;
            }

            Set<Long> recipientIds = getEligibleActivityUserIds(activity);
            boolean anyEnabled = recipientIds.stream().anyMatch(this::shouldSendActivityReminder);
            if (!anyEnabled) {
                continue;
            }

            LocalDateTime activityDateTime = LocalDateTime.of(activity.getItinerary().getDate(), activity.getStartTime());
            long minutesUntil = java.time.Duration.between(now, activityDateTime).toMinutes();

            // Only send reminder if time has not already passed
            if (minutesUntil < 0) {
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
                sendActivityReminderToRecipients(activity, title, message, recipientIds);
                activity.setReminderSent(true);
                activityRepository.save(activity);
            }
        }
    }

    @Scheduled(cron = "0 0 9 * * *") // Daily at 9 AM for 1-day reminders
    @Transactional
    public void sendDailyActivityReminders() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        List<Activity> activitiesTomorrow = activityRepository.findByItinerary_Date(tomorrow);

        for (Activity activity : activitiesTomorrow) {
            // Only send if 1-day reminder is configured
            if (activity.getReminder() == ActivityReminder.ONE_DAY && !activity.getReminderSent()) {
                Set<Long> recipientIds = getEligibleActivityUserIds(activity);
                boolean anyEnabled = recipientIds.stream().anyMatch(this::shouldSendActivityReminder);
                if (!anyEnabled) {
                    continue;
                }

                String title = "Activity Tomorrow";
                String message = "Your activity \"" + activity.getTitle() + "\" is scheduled for tomorrow at " + 
                    (activity.getStartTime() != null ? activity.getStartTime() : "the scheduled time");

                sendActivityReminderToRecipients(activity, title, message, recipientIds);
                activity.setReminderSent(true);
                activityRepository.save(activity);
            }
        }
    }

    /**
     * Gathers all eligible recipient user IDs for activity reminders:
     * - Trip owner (trip.getUser().getId())
     * - Accepted trip collaborators (via tripShareRepository.findByTripIdAndStatus)
     * - Group members associated with that trip (via groupRepository.findByTripIdWithDetails)
     */
    private Set<Long> getEligibleActivityUserIds(Activity activity) {
        Set<Long> userIds = new LinkedHashSet<>();
        if (activity == null || activity.getItinerary() == null || activity.getItinerary().getTrip() == null) {
            return userIds;
        }

        Trip trip = activity.getItinerary().getTrip();

        // 1. Trip owner
        if (trip.getUser() != null && trip.getUser().getId() != null) {
            userIds.add(trip.getUser().getId());
        }

        // 1b. Activity creator (if present and distinct)
        if (activity.getUser() != null && activity.getUser().getId() != null) {
            userIds.add(activity.getUser().getId());
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

    private boolean shouldSendActivityReminder(Long userId) {
        NotificationPreference preference = notificationPreferenceRepository.findByUserId(userId).orElse(null);
        return preference == null || preference.isActivityReminders();
    }

    private void sendActivityReminderToRecipients(Activity activity, String title, String message, Set<Long> recipientIds) {
        for (Long recipientId : recipientIds) {
            if (!shouldSendActivityReminder(recipientId)) {
                continue;
            }

            NotificationRequest request = new NotificationRequest();
            request.setType("ACTIVITY_REMINDER");
            request.setTitle(title);
            request.setMessage(message);
            request.setUserId(recipientId);
            request.setReferenceId(activity.getId());

            notificationService.createNotification(request);
        }
    }
}
