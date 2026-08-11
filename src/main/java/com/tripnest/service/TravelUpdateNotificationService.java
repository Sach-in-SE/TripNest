package com.tripnest.service;

import com.tripnest.entity.*;
import com.tripnest.repository.NotificationRepository;
import com.tripnest.repository.TripShareRepository;
import com.tripnest.repository.TripRepository;
import com.tripnest.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.HashSet;

@Service
public class TravelUpdateNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(TravelUpdateNotificationService.class);

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private TripShareRepository tripShareRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Notify trip members (excluding the actor) when trip details are updated
     */
    @Transactional
    public void notifyTripDetailsUpdated(Long tripId, Long actorUserId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        Set<Long> recipientIds = getRecipientIds(tripId, actorUserId, trip.getUser().getId());

        for (Long recipientId : recipientIds) {
            createNotificationIfNotExists(
                recipientId,
                NotificationType.TRAVEL_UPDATE,
                "Trip Details Updated",
                trip.getTitle() + " details were updated.",
                tripId
            );
        }
    }

    /**
     * Notify trip members (excluding the actor) when an itinerary is updated
     */
    @Transactional
    public void notifyItineraryUpdated(Long tripId, Long actorUserId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        Set<Long> recipientIds = getRecipientIds(tripId, actorUserId, trip.getUser().getId());

        for (Long recipientId : recipientIds) {
            createNotificationIfNotExists(
                recipientId,
                NotificationType.TRAVEL_UPDATE,
                "Itinerary Updated",
                "An itinerary for " + trip.getTitle() + " was updated.",
                tripId
            );
        }
    }

    /**
     * Notify trip members (excluding the actor) when an activity is added
     */
    @Transactional
    public void notifyActivityAdded(Long tripId, String activityTitle, Long actorUserId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        Set<Long> recipientIds = getRecipientIds(tripId, actorUserId, trip.getUser().getId());

        for (Long recipientId : recipientIds) {
            createNotificationIfNotExists(
                recipientId,
                NotificationType.TRAVEL_UPDATE,
                "Activity Added",
                activityTitle + " was added to your itinerary.",
                tripId
            );
        }
    }

    /**
     * Notify trip members (excluding the actor) when an activity is updated
     */
    @Transactional
    public void notifyActivityUpdated(Long tripId, String activityTitle, Long actorUserId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        Set<Long> recipientIds = getRecipientIds(tripId, actorUserId, trip.getUser().getId());

        for (Long recipientId : recipientIds) {
            createNotificationIfNotExists(
                recipientId,
                NotificationType.TRAVEL_UPDATE,
                "Activity Updated",
                activityTitle + " was updated.",
                tripId
            );
        }
    }

    /**
     * Notify trip members (excluding the actor) when an activity is deleted
     */
    @Transactional
    public void notifyActivityDeleted(Long tripId, String activityTitle, Long actorUserId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        Set<Long> recipientIds = getRecipientIds(tripId, actorUserId, trip.getUser().getId());

        for (Long recipientId : recipientIds) {
            createNotificationIfNotExists(
                recipientId,
                NotificationType.TRAVEL_UPDATE,
                "Activity Removed",
                activityTitle + " was removed from your itinerary.",
                tripId
            );
        }
    }

    /**
     * Notify trip members (excluding the actor) when the budget is updated
     */
    @Transactional
    public void notifyBudgetUpdated(Long tripId, Long actorUserId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        Set<Long> recipientIds = getRecipientIds(tripId, actorUserId, trip.getUser().getId());

        for (Long recipientId : recipientIds) {
            createNotificationIfNotExists(
                recipientId,
                NotificationType.TRAVEL_UPDATE,
                "Budget Updated",
                "The budget for " + trip.getTitle() + " was updated.",
                tripId
            );
        }
    }

    /**
     * Notify the affected member when their permission is changed
     */
    @Transactional
    public void notifyPermissionChanged(Long tripId, Long affectedUserId, SharePermission newPermission) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        createNotificationIfNotExists(
            affectedUserId,
            NotificationType.TRAVEL_UPDATE,
            "Permission Changed",
            "Your permission for " + trip.getTitle() + " was changed to " + newPermission.name() + ".",
            tripId
        );
    }

    /**
     * Notify the removed member
     */
    @Transactional
    public void notifyMemberRemoved(Long tripId, Long removedUserId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        createNotificationIfNotExists(
            removedUserId,
            NotificationType.TRAVEL_UPDATE,
            "Removed from Trip",
            "You have been removed from " + trip.getTitle() + ".",
            tripId
        );
    }

    /**
     * Notify both old and new owner during ownership transfer
     */
    @Transactional
    public void notifyOwnershipTransferred(Long tripId, Long oldOwnerId, Long newOwnerId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        // Notify new owner
        createNotificationIfNotExists(
            newOwnerId,
            NotificationType.TRAVEL_UPDATE,
            "Ownership Transferred",
            "You are now the owner of " + trip.getTitle() + ".",
            tripId
        );

        // Notify old owner
        createNotificationIfNotExists(
            oldOwnerId,
            NotificationType.TRAVEL_UPDATE,
            "Ownership Transferred",
            "Ownership of " + trip.getTitle() + " was transferred.",
            tripId
        );
    }

    /**
     * Get recipient IDs based on trip sharing rules
     * - Excludes the actor
     * - If actor is owner: notifies VIEW/EDIT members
     * - If actor is editor: notifies owner + other VIEW/EDIT members
     */
    private Set<Long> getRecipientIds(Long tripId, Long actorUserId, Long ownerId) {
        Set<Long> recipientIds = new HashSet<>();
        boolean isActorOwner = actorUserId.equals(ownerId);

        List<TripShare> shares = tripShareRepository.findByTripId(tripId);

        for (TripShare share : shares) {
            // Only consider accepted shares
            if (share.getStatus() != ShareStatus.ACCEPTED) {
                continue;
            }

            Long memberUserId = share.getSharedWithUser().getId();

            // Skip the actor
            if (memberUserId.equals(actorUserId)) {
                continue;
            }

            // If actor is owner, notify all accepted members (VIEW or EDIT)
            if (isActorOwner) {
                recipientIds.add(memberUserId);
            }
            // If actor is editor, notify owner + other VIEW/EDIT members
            else if (share.getPermission() == SharePermission.EDIT || share.getPermission() == SharePermission.VIEW) {
                recipientIds.add(memberUserId);
            }
        }

        // If actor is editor, also notify the owner
        if (!isActorOwner) {
            recipientIds.add(ownerId);
        }

        return recipientIds;
    }

    /**
     * Create notification only if one with the same type and referenceId doesn't already exist
     * This prevents duplicate notifications for the same event
     */
    private void createNotificationIfNotExists(Long userId, NotificationType type, String title, String message, Long referenceId) {
        boolean exists = notificationRepository.existsByUserIdAndTypeAndTitleAndMessageAndReferenceId(userId, type, title, message, referenceId);
        
        if (!exists) {
            Notification notification = new Notification();
            notification.setType(type);
            notification.setTitle(title);
            notification.setMessage(message);
            notification.setReferenceId(referenceId);
            
            // Set user via repository lookup
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                notification.setUser(user);
            }
            
            notificationRepository.save(notification);
            logger.info("Created notification for user {}: {}", userId, title);
        } else {
            logger.info("Notification already exists for user {} with type {} and referenceId {}, skipping", userId, type, referenceId);
        }
    }
}