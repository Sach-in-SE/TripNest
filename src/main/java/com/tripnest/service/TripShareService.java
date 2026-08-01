package com.tripnest.service;

import com.tripnest.dto.TripShareRequest;
import com.tripnest.dto.TripShareResponse;
import com.tripnest.entity.*;
import com.tripnest.repository.NotificationRepository;
import com.tripnest.repository.TripRepository;
import com.tripnest.repository.TripShareRepository;
import com.tripnest.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TripShareService {

    @Autowired
    private TripShareRepository tripShareRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    // ---------------------------------------------------------------
    // Invite a user (creates/resets a PENDING share + notification)
    // ---------------------------------------------------------------
    @Transactional
    public TripShareResponse inviteUser(TripShareRequest request, Long ownerId) {
        Trip trip = tripRepository.findById(request.getTripId())
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        if (!trip.getUser().getId().equals(ownerId)) {
            throw new RuntimeException("Only the trip owner can share this trip");
        }

        User targetUser = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("No user found with this email"));

        if (targetUser.getId().equals(ownerId)) {
            throw new RuntimeException("You cannot share a trip with yourself");
        }

        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("Owner not found"));

        // Create or reset an existing share record
        TripShare share = tripShareRepository
                .findByTripIdAndSharedWithUserId(trip.getId(), targetUser.getId())
                .orElse(new TripShare());

        share.setTrip(trip);
        share.setSharedWithUser(targetUser);
        share.setSharedByUser(owner);
        share.setPermission(request.getPermission() != null
                ? SharePermission.valueOf(request.getPermission())
                : SharePermission.VIEW);
        share.setStatus(ShareStatus.PENDING);

        TripShare saved = tripShareRepository.save(share);

        // Dispatch invitation notification to the invited user
        String ownerDisplayName = (owner.getFirstName() != null && !owner.getFirstName().isBlank())
                ? owner.getFirstName() + " " + (owner.getLastName() != null ? owner.getLastName() : "")
                : owner.getUsername();

        String dateRange = "";
        if (trip.getStartDate() != null && trip.getEndDate() != null) {
            dateRange = " (" + trip.getStartDate() + " – " + trip.getEndDate() + ")";
        } else if (trip.getStartDate() != null) {
            dateRange = " (from " + trip.getStartDate() + ")";
        }

        String permLabel = share.getPermission() == SharePermission.EDIT ? "Edit" : "View";

        Notification inviteNotif = new Notification();
        inviteNotif.setUser(targetUser);
        inviteNotif.setType(NotificationType.TRIP_INVITATION);
        inviteNotif.setTitle("Trip Invitation: " + trip.getTitle());
        inviteNotif.setMessage(ownerDisplayName.trim() + " invited you to collaborate on \""
                + trip.getTitle() + "\"" + dateRange + ". Permission: " + permLabel + ".");
        inviteNotif.setReferenceId(saved.getId());
        notificationRepository.save(inviteNotif);

        return mapToResponse(saved);
    }

    // ---------------------------------------------------------------
    // Respond to an invitation (ACCEPT / DECLINE)
    // ---------------------------------------------------------------
    @Transactional
    public TripShareResponse respondToInvitation(Long shareId, String action, Long respondingUserId) {
        TripShare share = tripShareRepository.findById(shareId)
                .orElseThrow(() -> new RuntimeException("Invitation not found"));

        if (!share.getSharedWithUser().getId().equals(respondingUserId)) {
            throw new RuntimeException("Unauthorized: you are not the invited user");
        }

        if (share.getStatus() != ShareStatus.PENDING) {
            throw new RuntimeException("This invitation has already been responded to");
        }

        User respondingUser = share.getSharedWithUser();
        String responderName = (respondingUser.getFirstName() != null && !respondingUser.getFirstName().isBlank())
                ? respondingUser.getFirstName() + " " + (respondingUser.getLastName() != null ? respondingUser.getLastName() : "")
                : respondingUser.getUsername();

        Trip trip = share.getTrip();
        User owner = share.getSharedByUser();

        if ("ACCEPT".equalsIgnoreCase(action)) {
            share.setStatus(ShareStatus.ACCEPTED);
            tripShareRepository.save(share);

            // Notify the trip owner
            Notification ownerNotif = new Notification();
            ownerNotif.setUser(owner);
            ownerNotif.setType(NotificationType.TRIP_INVITATION_RESPONSE);
            ownerNotif.setTitle("Invitation Accepted ✓");
            ownerNotif.setMessage(responderName.trim() + " has accepted your trip invitation for \""
                    + trip.getTitle() + "\".");
            ownerNotif.setReferenceId(trip.getId());
            notificationRepository.save(ownerNotif);

        } else if ("DECLINE".equalsIgnoreCase(action)) {
            share.setStatus(ShareStatus.DECLINED);
            tripShareRepository.save(share);

            // Notify the trip owner
            Notification ownerNotif = new Notification();
            ownerNotif.setUser(owner);
            ownerNotif.setType(NotificationType.TRIP_INVITATION_RESPONSE);
            ownerNotif.setTitle("Invitation Declined");
            ownerNotif.setMessage(responderName.trim() + " has declined your trip invitation for \""
                    + trip.getTitle() + "\".");
            ownerNotif.setReferenceId(trip.getId());
            notificationRepository.save(ownerNotif);

        } else {
            throw new RuntimeException("Invalid action. Use 'ACCEPT' or 'DECLINE'.");
        }

        return mapToResponse(tripShareRepository.findById(shareId).orElseThrow());
    }

    // ---------------------------------------------------------------
    // Existing operations (unchanged surface area)
    // ---------------------------------------------------------------
    public List<TripShareResponse> getTripShares(Long tripId, Long ownerId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        if (!trip.getUser().getId().equals(ownerId)) {
            throw new RuntimeException("Unauthorized");
        }

        return tripShareRepository.findByTripId(tripId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<TripShareResponse> getTripsSharedWithMe(Long userId) {
        return tripShareRepository.findBySharedWithUserId(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void removeShare(Long tripId, Long targetUserId, Long ownerId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        if (!trip.getUser().getId().equals(ownerId)) {
            throw new RuntimeException("Unauthorized");
        }

        TripShare share = tripShareRepository.findByTripIdAndSharedWithUserId(tripId, targetUserId)
                .orElseThrow(() -> new RuntimeException("Share access not found"));

        tripShareRepository.delete(share);
    }

    // Only counts ACCEPTED shares for access control
    public boolean hasAccess(Long tripId, Long userId) {
        return tripShareRepository.findByTripIdAndSharedWithUserId(tripId, userId)
                .map(share -> share.getStatus() == ShareStatus.ACCEPTED)
                .orElse(false);
    }

    public boolean hasEditAccess(Long tripId, Long userId) {
        return tripShareRepository.findByTripIdAndSharedWithUserId(tripId, userId)
                .map(share -> share.getStatus() == ShareStatus.ACCEPTED
                        && share.getPermission() == SharePermission.EDIT)
                .orElse(false);
    }

    // ---------------------------------------------------------------
    // Mapper
    // ---------------------------------------------------------------
    private TripShareResponse mapToResponse(TripShare share) {
        TripShareResponse response = new TripShareResponse();
        response.setId(share.getId());
        response.setTripId(share.getTrip().getId());
        response.setTripTitle(share.getTrip().getTitle());
        response.setSharedWithUserId(share.getSharedWithUser().getId());
        response.setSharedWithUsername(share.getSharedWithUser().getUsername());
        response.setSharedWithEmail(share.getSharedWithUser().getEmail());
        response.setSharedByUserId(share.getSharedByUser().getId());
        response.setSharedByUsername(share.getSharedByUser().getUsername());
        response.setPermission(share.getPermission().name());
        response.setStatus(share.getStatus() != null ? share.getStatus().name() : ShareStatus.PENDING.name());
        response.setCreatedAt(share.getCreatedAt());
        return response;
    }
}