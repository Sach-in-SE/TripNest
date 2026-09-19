package com.tripnest.service;

import com.tripnest.dto.TripShareRequest;
import com.tripnest.dto.TripShareResponse;
import com.tripnest.entity.*;
import com.tripnest.repository.GroupMemberRepository;
import com.tripnest.repository.GroupRepository;
import com.tripnest.repository.NotificationRepository;
import com.tripnest.repository.TripRepository;
import com.tripnest.repository.TripShareRepository;
import com.tripnest.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.tripnest.exception.BadRequestException;
import com.tripnest.exception.ResourceNotFoundException;
import com.tripnest.exception.UnauthorizedAccessException;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class TripShareService {

    @Autowired
    private TripShareRepository tripShareRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private TravelUpdateNotificationService travelUpdateNotificationService;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private GroupMemberRepository groupMemberRepository;

    private boolean isOwnerOrAdmin(Trip trip, Long userId) {
        if (userId == null) return false;
        if (trip.getUser().getId().equals(userId)) {
            return true;
        }
        return userRepository.findById(userId)
                .map(u -> u.getRoles() != null && u.getRoles().stream()
                        .anyMatch(r -> r.getName() == ERole.ROLE_ADMIN || r.getName() == ERole.ROLE_GROUP_ADMIN))
                .orElse(false);
    }

    // ---------------------------------------------------------------
    // Invite a user (creates/resets a PENDING share + notification)
    // ---------------------------------------------------------------
    @Transactional
    public TripShareResponse inviteUser(TripShareRequest request, Long ownerId) {
        Trip trip = tripRepository.findById(request.getTripId())
                .orElseThrow(() -> new ResourceNotFoundException("Trip", "id", request.getTripId()));

        if (!isOwnerOrAdmin(trip, ownerId)) {
            throw new UnauthorizedAccessException("Only the trip owner or admin can share this trip");
        }

        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new BadRequestException("Email is required");
        }

        User targetUser = userRepository.findByEmailIgnoreCase(request.getEmail().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.getEmail().trim()));

        if (targetUser.getId().equals(ownerId)) {
            throw new BadRequestException("You cannot share a trip with yourself");
        }

        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", ownerId));

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

        String ownerDisplayName = (owner.getFirstName() != null && !owner.getFirstName().isBlank())
                ? owner.getFirstName() + " " + (owner.getLastName() != null ? owner.getLastName() : "")
                : owner.getUsername();

        // Optional: link invited user to trip's TravelGroup discussion/chat
        if (Boolean.TRUE.equals(request.getAddToGroup())) {
            List<TravelGroup> groups = groupRepository.findByTripId(trip.getId());
            TravelGroup group;
            if (groups.isEmpty()) {
                group = new TravelGroup();
                group.setName(trip.getTitle() + " Group");
                group.setDescription("Discussion group for " + trip.getTitle());
                group.setCreatedBy(owner);
                group.setTrip(trip);
                group.setMembers(new HashSet<>(Collections.singletonList(owner)));
                group = groupRepository.save(group);

                GroupMember ownerMembership = new GroupMember();
                ownerMembership.setTravelGroup(group);
                ownerMembership.setUser(owner);
                ownerMembership.setInvitedBy(owner);
                ownerMembership.setRole(GroupRole.OWNER);
                ownerMembership.setStatus(GroupInvitationStatus.ACCEPTED);
                ownerMembership.setTripPermission(SharePermission.EDIT);
                ownerMembership.setJoinedAt(LocalDateTime.now());
                groupMemberRepository.save(ownerMembership);
            } else {
                group = groups.get(0);
            }

            Optional<GroupMember> existingMembership = groupMemberRepository.findByTravelGroupIdAndUserId(group.getId(), targetUser.getId());
            if (existingMembership.isEmpty()) {
                GroupMember membership = new GroupMember();
                membership.setTravelGroup(group);
                membership.setUser(targetUser);
                membership.setInvitedBy(owner);
                membership.setRole(GroupRole.MEMBER);
                membership.setStatus(GroupInvitationStatus.PENDING);
                membership.setTripPermission(share.getPermission());
                groupMemberRepository.save(membership);

                Notification groupNotif = new Notification();
                groupNotif.setUser(targetUser);
                groupNotif.setType(NotificationType.GROUP_INVITATION);
                groupNotif.setTitle("Group Invitation: " + group.getName());
                groupNotif.setMessage(ownerDisplayName.trim() + " invited you to join group \"" + group.getName() + "\" for trip \"" + trip.getTitle() + "\".");
                groupNotif.setReferenceId(membership.getId());
                notificationRepository.save(groupNotif);
            } else if (existingMembership.get().getStatus() == GroupInvitationStatus.DECLINED) {
                GroupMember membership = existingMembership.get();
                membership.setStatus(GroupInvitationStatus.PENDING);
                membership.setTripPermission(share.getPermission());
                groupMemberRepository.save(membership);
            }
        }

        // Dispatch invitation notification to the invited user
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
                .orElseThrow(() -> new ResourceNotFoundException("TripShare", "id", shareId));

        if (!share.getSharedWithUser().getId().equals(respondingUserId)) {
            throw new UnauthorizedAccessException("Unauthorized: you are not the invited user");
        }

        if (share.getStatus() != ShareStatus.PENDING) {
            throw new BadRequestException("This invitation has already been responded to");
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

            // Auto-accept any pending group membership for this user in trip groups
            List<TravelGroup> groups = groupRepository.findByTripId(trip.getId());
            for (TravelGroup g : groups) {
                groupMemberRepository.findByTravelGroupIdAndUserId(g.getId(), respondingUserId).ifPresent(gm -> {
                    if (gm.getStatus() == GroupInvitationStatus.PENDING) {
                        gm.setStatus(GroupInvitationStatus.ACCEPTED);
                        gm.setJoinedAt(LocalDateTime.now());
                        groupMemberRepository.save(gm);
                        g.getMembers().add(respondingUser);
                        groupRepository.save(g);
                    }
                });
            }

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

            // Decline any pending group membership for this user in trip groups
            List<TravelGroup> groups = groupRepository.findByTripId(trip.getId());
            for (TravelGroup g : groups) {
                groupMemberRepository.findByTravelGroupIdAndUserId(g.getId(), respondingUserId).ifPresent(gm -> {
                    if (gm.getStatus() == GroupInvitationStatus.PENDING) {
                        gm.setStatus(GroupInvitationStatus.DECLINED);
                        groupMemberRepository.save(gm);
                    }
                });
            }

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
            throw new BadRequestException("Invalid action. Use 'ACCEPT' or 'DECLINE'.");
        }

        return mapToResponse(tripShareRepository.findById(shareId)
                .orElseThrow(() -> new ResourceNotFoundException("TripShare", "id", shareId)));
    }

    // ---------------------------------------------------------------
    // Existing operations (unchanged surface area)
    // ---------------------------------------------------------------
    public List<TripShareResponse> getTripShares(Long tripId, Long ownerId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip", "id", tripId));

        if (!isOwnerOrAdmin(trip, ownerId)) {
            throw new UnauthorizedAccessException("Unauthorized");
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
                .orElseThrow(() -> new ResourceNotFoundException("Trip", "id", tripId));

        if (!isOwnerOrAdmin(trip, ownerId)) {
            throw new UnauthorizedAccessException("Unauthorized");
        }

        TripShare share = tripShareRepository.findByTripIdAndSharedWithUserId(tripId, targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("TripShare", "tripId/userId", tripId + "/" + targetUserId));

        // Notify the removed member
        travelUpdateNotificationService.notifyMemberRemoved(tripId, targetUserId);

        tripShareRepository.delete(share);

        // Also remove member from associated travel groups if not group owner
        List<TravelGroup> groups = groupRepository.findByTripId(tripId);
        for (TravelGroup g : groups) {
            groupMemberRepository.findByTravelGroupIdAndUserId(g.getId(), targetUserId).ifPresent(gm -> {
                if (gm.getRole() != GroupRole.OWNER) {
                    groupMemberRepository.delete(gm);
                    g.getMembers().removeIf(u -> u.getId().equals(targetUserId));
                    groupRepository.save(g);
                }
            });
        }
    }

    @Transactional
    public void updatePermission(Long tripId, Long targetUserId, SharePermission newPermission, Long ownerId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip", "id", tripId));

        if (!isOwnerOrAdmin(trip, ownerId)) {
            throw new UnauthorizedAccessException("Unauthorized");
        }

        TripShare share = tripShareRepository.findByTripIdAndSharedWithUserId(tripId, targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("TripShare", "tripId/userId", tripId + "/" + targetUserId));

        SharePermission oldPermission = share.getPermission();
        share.setPermission(newPermission);
        tripShareRepository.save(share);

        // Sync to group member trip permission
        List<TravelGroup> groups = groupRepository.findByTripId(tripId);
        for (TravelGroup g : groups) {
            groupMemberRepository.findByTravelGroupIdAndUserId(g.getId(), targetUserId).ifPresent(gm -> {
                gm.setTripPermission(newPermission);
                groupMemberRepository.save(gm);
            });
        }

        // Notify the affected member if permission changed
        if (!oldPermission.equals(newPermission)) {
            travelUpdateNotificationService.notifyPermissionChanged(tripId, targetUserId, newPermission);
        }
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