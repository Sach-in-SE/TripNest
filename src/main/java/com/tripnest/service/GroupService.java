package com.tripnest.service;

import com.tripnest.dto.EditGroupRequest;
import com.tripnest.dto.GroupDetailsResponse;
import com.tripnest.dto.GroupInvitationRequest;
import com.tripnest.dto.GroupMessageRequest;
import com.tripnest.dto.GroupMessageResponse;
import com.tripnest.dto.GroupMemberResponse;
import com.tripnest.dto.GroupRequest;
import com.tripnest.dto.GroupResponse;
import com.tripnest.dto.NotificationRequest;
import com.tripnest.dto.TripShareRequest;
import com.tripnest.dto.TransferOwnershipRequest;
import com.tripnest.dto.UpdateMemberPermissionRequest;
import com.tripnest.entity.ERole;
import com.tripnest.entity.GroupInvitationStatus;
import com.tripnest.entity.GroupMember;
import com.tripnest.entity.GroupMessage;
import com.tripnest.entity.GroupRole;
import com.tripnest.entity.NotificationType;
import com.tripnest.entity.SharePermission;
import com.tripnest.entity.ShareStatus;
import com.tripnest.entity.TravelGroup;
import com.tripnest.entity.Trip;
import com.tripnest.entity.TripShare;
import com.tripnest.entity.User;
import com.tripnest.repository.GroupMemberRepository;
import com.tripnest.repository.GroupMessageRepository;
import com.tripnest.repository.GroupRepository;
import com.tripnest.repository.TripRepository;
import com.tripnest.repository.TripShareRepository;
import com.tripnest.repository.UserRepository;
import com.tripnest.exception.BadRequestException;
import com.tripnest.exception.ResourceNotFoundException;
import com.tripnest.exception.UnauthorizedAccessException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class GroupService {

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private GroupMemberRepository groupMemberRepository;

    @Autowired
    private GroupMessageRepository groupMessageRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private TripShareRepository tripShareRepository;

    @Autowired
    private TravelUpdateNotificationService travelUpdateNotificationService;

    @Autowired
    private TripShareService tripShareService;

    @Transactional
    public GroupResponse createGroup(GroupRequest request, Long userId) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new BadRequestException("Group name is required");
        }

        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Trip trip = tripRepository.findById(request.getTripId())
                .orElseThrow(() -> new ResourceNotFoundException("Trip", "id", request.getTripId()));

        boolean isOwner = trip.getUser().getId().equals(userId);
        boolean hasEditAccess = tripShareService.hasEditAccess(trip.getId(), userId);
        if (!isOwner && !hasEditAccess) {
            throw new UnauthorizedAccessException("Unauthorized: You do not have permission to create a group for this trip");
        }

        TravelGroup group = new TravelGroup();
        group.setName(request.getName());
        group.setDescription(request.getDescription());
        group.setCreatedBy(creator);
        group.setTrip(trip);

        Set<User> members = new HashSet<>();
        members.add(creator);

        if (request.getMemberIds() != null) {
            for (Long memberId : request.getMemberIds()) {
                if (memberId == null || memberId.equals(userId)) {
                    continue;
                }
                userRepository.findById(memberId).ifPresent(members::add);
            }
        }
        group.setMembers(members);

        TravelGroup saved = groupRepository.save(group);
        createMembership(saved, creator, creator, GroupRole.OWNER, GroupInvitationStatus.ACCEPTED, SharePermission.EDIT);

        if (request.getMemberIds() != null) {
            for (Long memberId : request.getMemberIds()) {
                if (memberId == null || memberId.equals(userId)) {
                    continue;
                }
                userRepository.findById(memberId).ifPresent(member ->
                        createMembership(saved, member, creator, GroupRole.MEMBER, GroupInvitationStatus.ACCEPTED, SharePermission.VIEW)
                );
            }
        }

        return mapToResponse(saved, userId);
    }

    public List<GroupResponse> getUserGroups(Long userId) {
        List<TravelGroup> created = groupRepository.findByCreatedByIdWithDetails(userId);
        List<TravelGroup> member = groupRepository.findByMembersIdWithDetails(userId);

        Set<TravelGroup> allGroups = new LinkedHashSet<>();
        allGroups.addAll(created);
        allGroups.addAll(member);

        List<Long> groupIds = allGroups.stream().map(TravelGroup::getId).collect(Collectors.toList());
        Map<Long, GroupMember> memberMap = groupIds.isEmpty() ? Collections.emptyMap() :
                groupMemberRepository.findByTravelGroupIdInAndUserIdWithGroup(groupIds, userId)
                        .stream()
                        .collect(Collectors.toMap(gm -> gm.getTravelGroup().getId(), gm -> gm, (a, b) -> a));

        return allGroups.stream()
                .map(group -> mapToResponseWithMember(group, userId, memberMap.get(group.getId())))
                .collect(Collectors.toList());
    }

    public List<GroupResponse> getTripGroups(Long tripId, Long userId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip", "id", tripId));

        boolean isOwner = trip.getUser().getId().equals(userId);
        boolean hasAccess = tripShareService.hasAccess(tripId, userId);
        boolean isGroupMember = groupRepository.existsByTripIdAndMembersId(tripId, userId);
        if (!isOwner && !hasAccess && !isGroupMember) {
            throw new UnauthorizedAccessException("Unauthorized to view groups for this trip");
        }

        List<TravelGroup> groups = groupRepository.findByTripIdWithDetails(tripId);
        List<Long> groupIds = groups.stream().map(TravelGroup::getId).collect(Collectors.toList());
        Map<Long, GroupMember> memberMap = groupIds.isEmpty() ? Collections.emptyMap() :
                groupMemberRepository.findByTravelGroupIdInAndUserIdWithGroup(groupIds, userId)
                        .stream()
                        .collect(Collectors.toMap(gm -> gm.getTravelGroup().getId(), gm -> gm, (a, b) -> a));

        return groups.stream()
                .map(group -> mapToResponseWithMember(group, userId, memberMap.get(group.getId())))
                .collect(Collectors.toList());
    }

    public GroupDetailsResponse getGroupDetails(Long groupId, Long userId) {
        TravelGroup group = getAccessibleGroup(groupId, userId);
        return mapToDetailsResponse(group, userId);
    }

    public List<GroupMemberResponse> getUserInvitations(Long userId) {
        return groupMemberRepository.findByUserIdAndStatusWithDetailsOrderByInvitedAtDesc(userId, GroupInvitationStatus.PENDING)
                .stream()
                .map(this::mapToMemberResponse)
                .collect(Collectors.toList());
    }

    public List<GroupMemberResponse> getGroupMembers(Long groupId, Long userId) {
        getAccessibleGroup(groupId, userId);
        return groupMemberRepository.findByTravelGroupIdAndStatusWithDetailsOrderByJoinedAtAsc(groupId, GroupInvitationStatus.ACCEPTED)
                .stream()
                .map(this::mapToMemberResponse)
                .collect(Collectors.toList());
    }

    public List<GroupMemberResponse> getPendingInvitations(Long groupId, Long userId) {
        ensureOwner(groupId, userId);
        return groupMemberRepository.findByTravelGroupIdAndStatusWithDetailsOrderByInvitedAtDesc(groupId, GroupInvitationStatus.PENDING)
                .stream()
                .map(this::mapToMemberResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public GroupMemberResponse inviteMember(Long groupId, GroupInvitationRequest request, Long userId) {
        TravelGroup group = ensureOwner(groupId, userId);

        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new BadRequestException("Email is required");
        }

        User invitedUser = userRepository.findByEmailIgnoreCase(request.getEmail().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.getEmail().trim()));

        if (invitedUser.getId().equals(userId)) {
            throw new BadRequestException("You cannot invite yourself");
        }

        Optional<GroupMember> existingMembership = groupMemberRepository.findByTravelGroupIdAndUserId(groupId, invitedUser.getId());
        if (existingMembership.isPresent()) {
            GroupInvitationStatus status = existingMembership.get().getStatus();
            if (status == GroupInvitationStatus.ACCEPTED) {
                throw new BadRequestException("User is already a group member");
            }
            if (status == GroupInvitationStatus.PENDING) {
                throw new BadRequestException("An invitation is already pending for this user");
            }
        }

        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        SharePermission tripPermission = request.getTripPermission() != null 
            ? SharePermission.valueOf(request.getTripPermission()) 
            : SharePermission.VIEW;

        GroupMember membership = createMembership(group, invitedUser, owner, GroupRole.MEMBER, GroupInvitationStatus.PENDING, tripPermission);

        // Create TripShare if requested
        if (request.getShareTrip() != null && request.getShareTrip()) {
            Trip trip = group.getTrip();
            if (trip != null) {
                // Check if trip share already exists
                Optional<TripShare> existingShare = tripShareRepository.findByTripIdAndSharedWithUserId(trip.getId(), invitedUser.getId());
                
                TripShare tripShare = existingShare.orElse(new TripShare());
                tripShare.setTrip(trip);
                tripShare.setSharedWithUser(invitedUser);
                tripShare.setSharedByUser(owner);
                tripShare.setPermission(tripPermission);
                tripShare.setStatus(ShareStatus.PENDING);
                tripShareRepository.save(tripShare);
            }
        }

        NotificationRequest notification = new NotificationRequest();
        notification.setUserId(invitedUser.getId());
        notification.setType(NotificationType.GROUP_INVITATION.name());
        notification.setTitle("Group Invitation: " + group.getName());
        notification.setMessage(buildInvitationMessage(owner, group));
        notification.setReferenceId(membership.getId());
        notificationService.createNotification(notification);

        return mapToMemberResponse(membership);
    }

    @Transactional
    public GroupMemberResponse respondToInvitation(Long invitationId, String action, Long userId) {
        GroupMember membership = groupMemberRepository.findById(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("GroupMember", "id", invitationId));

        if (!membership.getUser().getId().equals(userId)) {
            throw new UnauthorizedAccessException("Unauthorized");
        }

        if (membership.getStatus() != GroupInvitationStatus.PENDING) {
            throw new BadRequestException("This invitation has already been handled");
        }

        if ("ACCEPT".equalsIgnoreCase(action)) {
            membership.setStatus(GroupInvitationStatus.ACCEPTED);
            membership.setJoinedAt(LocalDateTime.now());
            GroupMember saved = groupMemberRepository.save(membership);
            TravelGroup group = saved.getTravelGroup();
            group.getMembers().add(saved.getUser());
            groupRepository.save(group);
            
            // Auto-accept trip share if exists and sync permissions
            if (group.getTrip() != null) {
                Optional<TripShare> tripShare = tripShareRepository.findByTripIdAndSharedWithUserId(
                    group.getTrip().getId(), userId);
                if (tripShare.isPresent() && tripShare.get().getStatus() == ShareStatus.PENDING) {
                    TripShare share = tripShare.get();
                    share.setStatus(ShareStatus.ACCEPTED);
                    tripShareRepository.save(share);
                    
                    // Sync GroupMember.tripPermission with TripShare.permission
                    saved.setTripPermission(share.getPermission());
                    groupMemberRepository.save(saved);
                }
            }
            
            return mapToMemberResponse(saved);
        }

        if ("DECLINE".equalsIgnoreCase(action)) {
            TravelGroup group = membership.getTravelGroup();
            
            // Remove corresponding TripShare if exists
            if (group.getTrip() != null) {
                Optional<TripShare> tripShare = tripShareRepository.findByTripIdAndSharedWithUserId(
                    group.getTrip().getId(), userId);
                if (tripShare.isPresent()) {
                    tripShareRepository.delete(tripShare.get());
                }
            }
            
            groupMemberRepository.delete(membership);
            return mapToMemberResponse(membership);
        }

        throw new BadRequestException("Invalid action. Use 'ACCEPT' or 'DECLINE'.");
    }

    @Transactional
    public void cancelInvitation(Long groupId, Long invitationId, Long userId) {
        TravelGroup group = ensureOwner(groupId, userId);
        
        GroupMember membership = groupMemberRepository.findById(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("GroupMember", "id", invitationId));
        
        if (!membership.getTravelGroup().getId().equals(groupId)) {
            throw new BadRequestException("Invitation does not belong to this group");
        }
        
        if (membership.getStatus() != GroupInvitationStatus.PENDING) {
            throw new BadRequestException("Can only cancel pending invitations");
        }
        
        // Remove corresponding TripShare if exists
        if (group.getTrip() != null) {
            Optional<TripShare> tripShare = tripShareRepository.findByTripIdAndSharedWithUserId(
                group.getTrip().getId(), membership.getUser().getId());
            if (tripShare.isPresent()) {
                tripShareRepository.delete(tripShare.get());
            }
        }
        
        groupMemberRepository.delete(membership);
    }

    @Transactional
    public void resendInvitation(Long groupId, Long invitationId, Long userId) {
        TravelGroup group = ensureOwner(groupId, userId);
        
        GroupMember membership = groupMemberRepository.findById(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("GroupMember", "id", invitationId));
        
        if (!membership.getTravelGroup().getId().equals(groupId)) {
            throw new BadRequestException("Invitation does not belong to this group");
        }
        
        if (membership.getStatus() != GroupInvitationStatus.PENDING) {
            throw new BadRequestException("Can only resend pending invitations");
        }
        
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        // Create new notification
        NotificationRequest notification = new NotificationRequest();
        notification.setUserId(membership.getUser().getId());
        notification.setType(NotificationType.GROUP_INVITATION.name());
        notification.setTitle("Group Invitation: " + group.getName());
        notification.setMessage(buildInvitationMessage(owner, group));
        notification.setReferenceId(membership.getId());
        notificationService.createNotification(notification);
    }

    @Transactional
    public void removeMember(Long groupId, Long memberId, Long userId) {
        TravelGroup group = ensureOwner(groupId, userId);

        GroupMember membership = groupMemberRepository.findByTravelGroupIdAndUserId(groupId, memberId)
                .orElseThrow(() -> new ResourceNotFoundException("GroupMember", "memberId", memberId));

        if (group.getCreatedBy().getId().equals(memberId)) {
            throw new BadRequestException("Owner cannot be removed from the group");
        }

        if (membership.getStatus() == GroupInvitationStatus.ACCEPTED) {
            group.getMembers().removeIf(member -> member.getId().equals(memberId));
            groupRepository.save(group);
        }

        // Remove corresponding TripShare if exists
        if (group.getTrip() != null) {
            Optional<TripShare> tripShare = tripShareRepository.findByTripIdAndSharedWithUserId(
                group.getTrip().getId(), memberId);
            if (tripShare.isPresent()) {
                tripShareRepository.delete(tripShare.get());
            }
        }

        groupMemberRepository.delete(membership);
    }

    @Transactional
    public void leaveGroup(Long groupId, Long userId) {
        TravelGroup group = getAccessibleGroup(groupId, userId);

        if (group.getCreatedBy().getId().equals(userId)) {
            throw new BadRequestException("Owner cannot leave the group");
        }

        GroupMember membership = groupMemberRepository.findByTravelGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new UnauthorizedAccessException("You are not a member of this group"));

        if (membership.getStatus() != GroupInvitationStatus.ACCEPTED) {
            throw new BadRequestException("Only active members can leave the group");
        }

        group.getMembers().removeIf(member -> member.getId().equals(userId));
        groupRepository.save(group);
        
        // Remove corresponding TripShare if exists
        if (group.getTrip() != null) {
            Optional<TripShare> tripShare = tripShareRepository.findByTripIdAndSharedWithUserId(
                group.getTrip().getId(), userId);
            if (tripShare.isPresent()) {
                tripShareRepository.delete(tripShare.get());
            }
        }
        
        groupMemberRepository.delete(membership);
    }

    @Transactional
    public GroupResponse addMember(Long groupId, Long memberId, Long userId) {
        TravelGroup group = ensureOwner(groupId, userId);
        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", memberId));

        if (member.getId().equals(userId)) {
            throw new BadRequestException("Owner is already part of the group");
        }

        GroupMember membership = groupMemberRepository.findByTravelGroupIdAndUserId(groupId, memberId)
                .orElse(null);
        if (membership != null && membership.getStatus() == GroupInvitationStatus.ACCEPTED) {
            throw new BadRequestException("User is already a group member");
        }

        if (membership == null) {
            membership = createMembership(group, member, group.getCreatedBy(), GroupRole.MEMBER, GroupInvitationStatus.ACCEPTED, SharePermission.VIEW);
        } else {
            membership.setStatus(GroupInvitationStatus.ACCEPTED);
            membership.setJoinedAt(LocalDateTime.now());
            membership.setRole(GroupRole.MEMBER);
            membership.setTripPermission(SharePermission.VIEW);
            membership.setInvitedBy(group.getCreatedBy());
            membership = groupMemberRepository.save(membership);
        }

        group.getMembers().add(member);
        groupRepository.save(group);
        return mapToResponse(group, userId);
    }

    @Transactional
    public void deleteGroup(Long groupId, Long userId) {
        ensureOwner(groupId, userId);
        groupMessageRepository.deleteByTravelGroupId(groupId);
        groupMemberRepository.deleteByTravelGroupId(groupId);
        TravelGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("TravelGroup", "id", groupId));
        groupRepository.delete(group);
    }

    public List<GroupMessageResponse> getGroupMessages(Long groupId, Long userId, Long beforeId, Integer limit) {
        TravelGroup group = getAccessibleGroup(groupId, userId);
        int pageSize = (limit != null && limit > 0 && limit <= 100) ? limit : 50;
        List<GroupMessage> messages = new ArrayList<>(
                beforeId != null
                        ? groupMessageRepository.findRecentByTravelGroupIdWithSender(group.getId(), beforeId, PageRequest.of(0, pageSize))
                        : groupMessageRepository.findRecentByTravelGroupIdWithSender(group.getId(), PageRequest.of(0, pageSize))
        );
        Collections.reverse(messages);
        return messages.stream()
                .map(msg -> mapToMessageResponse(msg, userId))
                .collect(Collectors.toList());
    }

    public List<GroupMessageResponse> getGroupMessages(Long groupId, Long userId) {
        return getGroupMessages(groupId, userId, null, 50);
    }

    @Transactional
    public GroupMessageResponse sendGroupMessage(Long groupId, GroupMessageRequest request, Long userId) {
        if (request.getContent() == null || request.getContent().trim().isEmpty()) {
            throw new BadRequestException("Message content cannot be blank");
        }
        if (request.getContent().length() > 1000) {
            throw new BadRequestException("Message content cannot exceed 1000 characters");
        }

        TravelGroup group = getAccessibleGroup(groupId, userId);
        User sender = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        GroupMessage message = new GroupMessage();
        message.setTravelGroup(group);
        message.setSender(sender);
        message.setContent(request.getContent().trim());

        GroupMessage saved = groupMessageRepository.save(message);
        return mapToMessageResponse(saved, userId);
    }

    private GroupMessageResponse mapToMessageResponse(GroupMessage message, Long currentUserId) {
        GroupMessageResponse response = new GroupMessageResponse();
        response.setId(message.getId());
        response.setGroupId(message.getTravelGroup().getId());
        response.setSenderId(message.getSender().getId());
        response.setSenderName(buildDisplayName(message.getSender()));
        response.setSenderUsername(message.getSender().getUsername());
        response.setContent(message.getContent());
        response.setCreatedAt(message.getCreatedAt());
        response.setIsSelf(message.getSender().getId().equals(currentUserId));
        return response;
    }

    @Transactional
    public GroupResponse editGroup(Long groupId, EditGroupRequest request, Long userId) {
        TravelGroup group = ensureOwner(groupId, userId);
        
        if (request.getName() == null || request.getName().isBlank()) {
            throw new BadRequestException("Group name is required");
        }
        
        group.setName(request.getName());
        if (request.getDescription() != null) {
            group.setDescription(request.getDescription());
        }
        
        TravelGroup saved = groupRepository.save(group);
        return mapToResponse(saved, userId);
    }

    @Transactional
    public void transferOwnership(Long groupId, Long newOwnerId, Long currentOwnerId) {
        TravelGroup group = ensureOwner(groupId, currentOwnerId);
        
        if (newOwnerId.equals(currentOwnerId)) {
            throw new BadRequestException("You cannot transfer ownership to yourself");
        }
        
        GroupMember newOwnerMembership = groupMemberRepository.findByTravelGroupIdAndUserId(groupId, newOwnerId)
                .orElseThrow(() -> new ResourceNotFoundException("User is not a member of this group"));
        
        if (newOwnerMembership.getStatus() != GroupInvitationStatus.ACCEPTED) {
            throw new BadRequestException("Can only transfer ownership to accepted members");
        }
        
        User newOwner = userRepository.findById(newOwnerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", newOwnerId));
        
        User currentOwner = userRepository.findById(currentOwnerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentOwnerId));
        
        // Update group ownership
        group.setCreatedBy(newOwner);
        groupRepository.save(group);
        
        // Update roles
        newOwnerMembership.setRole(GroupRole.OWNER);
        groupMemberRepository.save(newOwnerMembership);
        
        // Change old owner to member
        GroupMember oldOwnerMembership = groupMemberRepository.findByTravelGroupIdAndUserId(groupId, currentOwnerId)
                .orElseThrow(() -> new ResourceNotFoundException("GroupMember", "userId", currentOwnerId));
        oldOwnerMembership.setRole(GroupRole.MEMBER);
        groupMemberRepository.save(oldOwnerMembership);

        // Update trip ownership and notify if group is associated with a trip and caller owns the trip
        if (group.getTrip() != null) {
            Trip trip = group.getTrip();
            if (trip.getUser().getId().equals(currentOwnerId)) {
                trip.setUser(newOwner);
                tripRepository.save(trip);
                travelUpdateNotificationService.notifyOwnershipTransferred(trip.getId(), currentOwnerId, newOwnerId);
            }
        }
    }

    @Transactional
    public void updateMemberPermission(Long groupId, Long memberId, String tripPermission, Long userId) {
        TravelGroup group = ensureOwner(groupId, userId);
        
        GroupMember membership = groupMemberRepository.findByTravelGroupIdAndUserId(groupId, memberId)
                .orElseThrow(() -> new ResourceNotFoundException("GroupMember", "memberId", memberId));
        
        if (membership.getRole() == GroupRole.OWNER) {
            throw new BadRequestException("Cannot change owner's permissions");
        }
        
        SharePermission permission = SharePermission.valueOf(tripPermission);
        membership.setTripPermission(permission);
        groupMemberRepository.save(membership);
        
        // Update corresponding TripShare if exists
        if (group.getTrip() != null) {
            Optional<TripShare> tripShare = tripShareRepository.findByTripIdAndSharedWithUserId(
                group.getTrip().getId(), memberId);
            if (tripShare.isPresent()) {
                TripShare share = tripShare.get();
                share.setPermission(permission);
                tripShareRepository.save(share);
            }
        }
    }

    @Transactional
    public void removeTripShare(Long groupId, Long memberId, Long userId) {
        TravelGroup group = ensureOwner(groupId, userId);
        
        GroupMember membership = groupMemberRepository.findByTravelGroupIdAndUserId(groupId, memberId)
                .orElseThrow(() -> new ResourceNotFoundException("GroupMember", "memberId", memberId));
        
        if (membership.getRole() == GroupRole.OWNER) {
            throw new BadRequestException("Cannot remove trip share from owner");
        }
        
        // Reset member's trip permission to VIEW
        membership.setTripPermission(SharePermission.VIEW);
        groupMemberRepository.save(membership);
        
        // Remove corresponding TripShare if exists
        if (group.getTrip() != null) {
            Optional<TripShare> tripShare = tripShareRepository.findByTripIdAndSharedWithUserId(
                group.getTrip().getId(), memberId);
            if (tripShare.isPresent()) {
                tripShareRepository.delete(tripShare.get());
            }
        }
    }

    private GroupResponse mapToResponse(TravelGroup group, Long currentUserId) {
        return mapToResponseWithMember(group, currentUserId, null);
    }

    private GroupResponse mapToResponseWithMember(TravelGroup group, Long currentUserId, GroupMember member) {
        GroupResponse response = new GroupResponse();
        response.setId(group.getId());
        response.setName(group.getName());
        response.setDescription(group.getDescription());
        response.setTripId(group.getTrip().getId());
        response.setTripTitle(group.getTrip().getTitle());
        response.setCreatedById(group.getCreatedBy().getId());
        response.setCreatedByUsername(group.getCreatedBy().getUsername());
        response.setMemberUsernames(group.getMembers().stream()
                .map(User::getUsername)
                .collect(Collectors.toList()));
        response.setMemberCount(group.getMembers().size());
        if (member != null && member.getStatus() == GroupInvitationStatus.ACCEPTED) {
            response.setCurrentUserRole(member.getRole() != null ? member.getRole().name() : null);
        } else {
            response.setCurrentUserRole(resolveCurrentUserRole(group, currentUserId));
        }
        response.setCreatedAt(group.getCreatedAt());
        response.setUpdatedAt(group.getUpdatedAt());
        return response;
    }

    private GroupDetailsResponse mapToDetailsResponse(TravelGroup group, Long currentUserId) {
        GroupDetailsResponse response = new GroupDetailsResponse();
        response.setId(group.getId());
        response.setName(group.getName());
        response.setDescription(group.getDescription());
        response.setTripId(group.getTrip().getId());
        response.setTripTitle(group.getTrip().getTitle());
        response.setTripDestination(group.getTrip().getDestination());
        response.setTripStartDate(group.getTrip().getStartDate());
        response.setTripEndDate(group.getTrip().getEndDate());
        response.setTripBudget(group.getTrip().getBudget());
        response.setCreatedById(group.getCreatedBy().getId());
        response.setCreatedByUsername(group.getCreatedBy().getUsername());
        response.setCurrentUserRole(resolveCurrentUserRole(group, currentUserId));
        response.setCanEditTrip(canEditTrip(group, currentUserId));
        response.setCanInviteMembers(isOwnerOrAdmin(group, currentUserId));
        response.setCanRemoveMembers(isOwnerOrAdmin(group, currentUserId));
        response.setCanDeleteGroup(isOwnerOrAdmin(group, currentUserId));
        response.setCanLeaveGroup(canLeaveGroup(group, currentUserId));
        response.setMembers(groupMemberRepository.findByTravelGroupIdAndStatusWithDetailsOrderByJoinedAtAsc(group.getId(), GroupInvitationStatus.ACCEPTED)
                .stream()
                .map(this::mapToMemberResponse)
                .collect(Collectors.toList()));
        response.setPendingInvitations(groupMemberRepository.findByTravelGroupIdAndStatusWithDetailsOrderByInvitedAtDesc(group.getId(), GroupInvitationStatus.PENDING)
                .stream()
                .map(this::mapToMemberResponse)
                .collect(Collectors.toList()));
        return response;
    }

    private GroupMemberResponse mapToMemberResponse(GroupMember membership) {
        GroupMemberResponse response = new GroupMemberResponse();
        response.setId(membership.getId());
        response.setGroupId(membership.getTravelGroup().getId());
        response.setGroupName(membership.getTravelGroup().getName());
        response.setTripId(membership.getTravelGroup().getTrip().getId());
        response.setTripTitle(membership.getTravelGroup().getTrip().getTitle());
        response.setUserId(membership.getUser().getId());
        response.setName(buildDisplayName(membership.getUser()));
        response.setEmail(membership.getUser().getEmail());
        response.setRole(membership.getRole() != null ? membership.getRole().name() : GroupRole.MEMBER.name());
        response.setStatus(membership.getStatus() != null ? membership.getStatus().name() : GroupInvitationStatus.PENDING.name());
        response.setInvitedAt(membership.getInvitedAt());
        response.setJoinedAt(membership.getJoinedAt());
        response.setInvitedByUsername(membership.getInvitedBy() != null ? membership.getInvitedBy().getUsername() : null);
        response.setTripPermission(membership.getTripPermission() != null ? membership.getTripPermission().name() : SharePermission.VIEW.name());
        return response;
    }

    private GroupMember createMembership(TravelGroup group, User user, User invitedBy, GroupRole role, GroupInvitationStatus status, SharePermission tripPermission) {
        GroupMember membership = groupMemberRepository.findByTravelGroupIdAndUserId(group.getId(), user.getId())
                .orElse(new GroupMember());
        membership.setTravelGroup(group);
        membership.setUser(user);
        membership.setInvitedBy(invitedBy);
        membership.setRole(role);
        membership.setStatus(status);
        membership.setTripPermission(tripPermission);
        membership.setInvitedAt(LocalDateTime.now());
        membership.setJoinedAt(status == GroupInvitationStatus.ACCEPTED ? LocalDateTime.now() : null);
        GroupMember saved = groupMemberRepository.save(membership);
        if (status == GroupInvitationStatus.ACCEPTED) {
            group.getMembers().add(user);
            groupRepository.save(group);
        }
        return saved;
    }

    private TravelGroup ensureOwner(Long groupId, Long userId) {
        TravelGroup group = groupRepository.findByIdWithDetails(groupId)
                .or(() -> groupRepository.findById(groupId))
                .orElseThrow(() -> new ResourceNotFoundException("TravelGroup", "id", groupId));

        if (!isOwnerOrAdmin(group, userId)) {
            throw new UnauthorizedAccessException("Only the group owner or trip owner/admin can perform this action");
        }

        return group;
    }

    public TravelGroup getAccessibleGroup(Long groupId, Long userId) {
        TravelGroup group = groupRepository.findByIdWithDetails(groupId)
                .or(() -> groupRepository.findById(groupId))
                .orElseThrow(() -> new ResourceNotFoundException("TravelGroup", "id", groupId));

        if (isOwner(group, userId)) {
            return group;
        }

        GroupMember membership = groupMemberRepository.findByTravelGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new UnauthorizedAccessException("You are not a member of this group"));

        if (membership.getStatus() != GroupInvitationStatus.ACCEPTED) {
            throw new UnauthorizedAccessException("Your membership is not active. Current status: " + membership.getStatus());
        }

        return group;
    }

    private boolean isOwner(TravelGroup group, Long userId) {
        if (userId == null) return false;
        if (group.getCreatedBy() != null && group.getCreatedBy().getId().equals(userId)) {
            return true;
        }
        return group.getTrip() != null && group.getTrip().getUser() != null && group.getTrip().getUser().getId().equals(userId);
    }

    private boolean isOwnerOrAdmin(TravelGroup group, Long userId) {
        if (userId == null) return false;
        if (isOwner(group, userId)) {
            return true;
        }
        boolean isOwnerMember = groupMemberRepository.findByTravelGroupIdAndUserId(group.getId(), userId)
                .map(m -> m.getRole() == GroupRole.OWNER && m.getStatus() == GroupInvitationStatus.ACCEPTED)
                .orElse(false);
        if (isOwnerMember) {
            return true;
        }
        return userRepository.findById(userId)
                .map(u -> u.getRoles() != null && u.getRoles().stream()
                        .anyMatch(r -> r.getName() == ERole.ROLE_ADMIN || r.getName() == ERole.ROLE_GROUP_ADMIN))
                .orElse(false);
    }

    private boolean canLeaveGroup(TravelGroup group, Long userId) {
        return !isOwner(group, userId)
                && groupMemberRepository.findByTravelGroupIdAndUserId(group.getId(), userId)
                .map(member -> member.getStatus() == GroupInvitationStatus.ACCEPTED)
                .orElse(false);
    }

    private String resolveCurrentUserRole(TravelGroup group, Long currentUserId) {
        if (currentUserId == null) {
            return null;
        }

        if (isOwner(group, currentUserId)) {
            return GroupRole.OWNER.name();
        }

        return groupMemberRepository.findByTravelGroupIdAndUserId(group.getId(), currentUserId)
                .filter(member -> member.getStatus() == GroupInvitationStatus.ACCEPTED)
                .map(member -> member.getRole().name())
                .orElse(null);
    }

    private boolean canEditTrip(TravelGroup group, Long currentUserId) {
        if (isOwner(group, currentUserId)) {
            return true;
        }
        
        GroupMember membership = groupMemberRepository.findByTravelGroupIdAndUserId(group.getId(), currentUserId)
                .orElse(null);
        
        if (membership == null || membership.getStatus() != GroupInvitationStatus.ACCEPTED) {
            return false;
        }
        
        return membership.getTripPermission() == SharePermission.EDIT;
    }

    private String buildDisplayName(User user) {
        String firstName = user.getFirstName();
        String lastName = user.getLastName();
        if (firstName != null && !firstName.isBlank()) {
            return (firstName + " " + (lastName != null ? lastName : "")).trim();
        }
        return user.getUsername();
    }

    private String buildInvitationMessage(User owner, TravelGroup group) {
        String ownerName = buildDisplayName(owner);
        String tripTitle = group.getTrip() != null ? group.getTrip().getTitle() : "your trip";
        return ownerName + " invited you to join group \"" + group.getName() + "\" for trip \"" + tripTitle + "\".";
    }
}