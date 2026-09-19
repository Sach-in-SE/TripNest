package com.tripnest.controller;

import com.tripnest.dto.EditGroupRequest;
import com.tripnest.dto.GroupDetailsResponse;
import com.tripnest.dto.GroupInvitationRequest;
import com.tripnest.dto.GroupMemberResponse;
import com.tripnest.dto.GroupMessageRequest;
import com.tripnest.dto.GroupMessageResponse;
import com.tripnest.dto.GroupRequest;
import com.tripnest.dto.GroupResponse;
import com.tripnest.dto.MessageResponse;
import com.tripnest.dto.RespondRequest;
import com.tripnest.dto.TransferOwnershipRequest;
import com.tripnest.dto.UpdateMemberPermissionRequest;
import com.tripnest.exception.ResourceNotFoundException;
import com.tripnest.security.UserDetailsImpl;
import com.tripnest.service.GroupService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    @Autowired
    private GroupService groupService;

    @Autowired(required = false)
    private org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    @GetMapping("/admin/summary")
    @PreAuthorize("hasAnyRole('GROUP_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getGroupAdminSummary() {
        UserDetailsImpl userDetails = getCurrentUser();
        List<GroupResponse> groups = groupService.getUserGroups(userDetails.getId());
        return ResponseEntity.ok(groups);
    }

    @PostMapping
    public ResponseEntity<?> createGroup(@Valid @RequestBody GroupRequest request) {
        try {
            UserDetailsImpl userDetails = getCurrentUser();
            GroupResponse response = groupService.createGroup(request, userDetails.getId());
            return ResponseEntity.ok(response);
        } catch (AccessDeniedException | SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse(e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getUserGroups() {
        UserDetailsImpl userDetails = getCurrentUser();
        List<GroupResponse> groups = groupService.getUserGroups(userDetails.getId());
        return ResponseEntity.ok(groups);
    }

    @GetMapping("/trip/{tripId}")
    public ResponseEntity<?> getTripGroups(@PathVariable Long tripId) {
        UserDetailsImpl userDetails = getCurrentUser();
        List<GroupResponse> groups = groupService.getTripGroups(tripId, userDetails.getId());
        return ResponseEntity.ok(groups);
    }

    @GetMapping("/invitations")
    public ResponseEntity<?> getMyInvitations() {
        UserDetailsImpl userDetails = getCurrentUser();
        List<GroupMemberResponse> invitations = groupService.getUserInvitations(userDetails.getId());
        return ResponseEntity.ok(invitations);
    }

    @GetMapping("/{groupId}")
    public ResponseEntity<?> getGroupDetails(@PathVariable Long groupId) {
        try {
            UserDetailsImpl userDetails = getCurrentUser();
            GroupDetailsResponse response = groupService.getGroupDetails(groupId, userDetails.getId());
            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(e.getMessage()));
        } catch (AccessDeniedException | SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse(e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse(e.getMessage()));
        }
    }

    @GetMapping("/{groupId}/members")
    public ResponseEntity<?> getGroupMembers(@PathVariable Long groupId) {
        UserDetailsImpl userDetails = getCurrentUser();
        List<GroupMemberResponse> members = groupService.getGroupMembers(groupId, userDetails.getId());
        return ResponseEntity.ok(members);
    }

    @GetMapping("/{groupId}/pending-invitations")
    public ResponseEntity<?> getPendingInvitations(@PathVariable Long groupId) {
        UserDetailsImpl userDetails = getCurrentUser();
        List<GroupMemberResponse> invitations = groupService.getPendingInvitations(groupId, userDetails.getId());
        return ResponseEntity.ok(invitations);
    }

    @DeleteMapping("/{groupId}/invitations/{invitationId}")
    public ResponseEntity<?> cancelInvitation(@PathVariable Long groupId, @PathVariable Long invitationId) {
        try {
            UserDetailsImpl userDetails = getCurrentUser();
            groupService.cancelInvitation(groupId, invitationId, userDetails.getId());
            return ResponseEntity.ok(new MessageResponse("Invitation cancelled successfully!"));
        } catch (AccessDeniedException | SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse(e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/{groupId}/invitations/{invitationId}/resend")
    public ResponseEntity<?> resendInvitation(@PathVariable Long groupId, @PathVariable Long invitationId) {
        try {
            UserDetailsImpl userDetails = getCurrentUser();
            groupService.resendInvitation(groupId, invitationId, userDetails.getId());
            return ResponseEntity.ok(new MessageResponse("Invitation resent successfully!"));
        } catch (AccessDeniedException | SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse(e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/{groupId}/invite")
    public ResponseEntity<?> inviteMember(@PathVariable Long groupId, @RequestBody GroupInvitationRequest request) {
        try {
            UserDetailsImpl userDetails = getCurrentUser();
            GroupMemberResponse response = groupService.inviteMember(groupId, request, userDetails.getId());
            return ResponseEntity.ok(response);
        } catch (AccessDeniedException | SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse(e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/invitations/{invitationId}/respond")
    public ResponseEntity<?> respondToInvitation(@PathVariable Long invitationId, @RequestBody RespondRequest request) {
        try {
            UserDetailsImpl userDetails = getCurrentUser();
            GroupMemberResponse response = groupService.respondToInvitation(invitationId, request.getAction(), userDetails.getId());
            return ResponseEntity.ok(response);
        } catch (AccessDeniedException | SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse(e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/{groupId}/members/{memberId}")
    public ResponseEntity<?> removeMember(@PathVariable Long groupId, @PathVariable Long memberId) {
        try {
            UserDetailsImpl userDetails = getCurrentUser();
            groupService.removeMember(groupId, memberId, userDetails.getId());
            return ResponseEntity.ok(new MessageResponse("Member removed successfully!"));
        } catch (AccessDeniedException | SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse(e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/{groupId}/leave")
    public ResponseEntity<?> leaveGroup(@PathVariable Long groupId) {
        try {
            UserDetailsImpl userDetails = getCurrentUser();
            groupService.leaveGroup(groupId, userDetails.getId());
            return ResponseEntity.ok(new MessageResponse("You left the group successfully!"));
        } catch (AccessDeniedException | SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse(e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/{groupId}/members/{memberId}")
    public ResponseEntity<?> addMember(@PathVariable Long groupId, @PathVariable Long memberId) {
        try {
            UserDetailsImpl userDetails = getCurrentUser();
            GroupResponse response = groupService.addMember(groupId, memberId, userDetails.getId());
            return ResponseEntity.ok(response);
        } catch (AccessDeniedException | SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse(e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/{groupId}")
    public ResponseEntity<?> deleteGroup(@PathVariable Long groupId) {
        try {
            UserDetailsImpl userDetails = getCurrentUser();
            groupService.deleteGroup(groupId, userDetails.getId());
            return ResponseEntity.ok(new MessageResponse("Group deleted successfully!"));
        } catch (AccessDeniedException | SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse(e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PutMapping("/{groupId}")
    public ResponseEntity<?> editGroup(@PathVariable Long groupId, @Valid @RequestBody EditGroupRequest request) {
        try {
            UserDetailsImpl userDetails = getCurrentUser();
            GroupResponse response = groupService.editGroup(groupId, request, userDetails.getId());
            return ResponseEntity.ok(response);
        } catch (AccessDeniedException | SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse(e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/{groupId}/transfer-ownership")
    public ResponseEntity<?> transferOwnership(@PathVariable Long groupId, @RequestBody TransferOwnershipRequest request) {
        try {
            UserDetailsImpl userDetails = getCurrentUser();
            groupService.transferOwnership(groupId, request.getNewOwnerId(), userDetails.getId());
            return ResponseEntity.ok(new MessageResponse("Ownership transferred successfully!"));
        } catch (AccessDeniedException | SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse(e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PutMapping("/{groupId}/members/{memberId}/permission")
    public ResponseEntity<?> updateMemberPermission(@PathVariable Long groupId, @PathVariable Long memberId, @RequestBody UpdateMemberPermissionRequest request) {
        try {
            UserDetailsImpl userDetails = getCurrentUser();
            groupService.updateMemberPermission(groupId, memberId, request.getTripPermission(), userDetails.getId());
            return ResponseEntity.ok(new MessageResponse("Member permission updated successfully!"));
        } catch (AccessDeniedException | SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse(e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/{groupId}/members/{memberId}/trip-share")
    public ResponseEntity<?> removeTripShare(@PathVariable Long groupId, @PathVariable Long memberId) {
        try {
            UserDetailsImpl userDetails = getCurrentUser();
            groupService.removeTripShare(groupId, memberId, userDetails.getId());
            return ResponseEntity.ok(new MessageResponse("Trip share removed successfully!"));
        } catch (AccessDeniedException | SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse(e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @GetMapping("/{groupId}/messages")
    public ResponseEntity<?> getGroupMessages(
            @PathVariable Long groupId,
            @RequestParam(required = false) Long beforeId,
            @RequestParam(required = false) Integer limit) {
        try {
            UserDetailsImpl userDetails = getCurrentUser();
            List<GroupMessageResponse> messages;
            if (beforeId == null && limit == null) {
                messages = groupService.getGroupMessages(groupId, userDetails.getId());
            } else {
                messages = groupService.getGroupMessages(groupId, userDetails.getId(), beforeId, limit != null ? limit : 50);
            }
            return ResponseEntity.ok(messages);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(e.getMessage()));
        } catch (AccessDeniedException | SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/{groupId}/messages")
    public ResponseEntity<?> sendGroupMessage(@PathVariable Long groupId, @Valid @RequestBody GroupMessageRequest request) {
        try {
            UserDetailsImpl userDetails = getCurrentUser();
            GroupMessageResponse response = groupService.sendGroupMessage(groupId, request, userDetails.getId());
            if (messagingTemplate != null) {
                try {
                    messagingTemplate.convertAndSend("/topic/groups/" + groupId, response);
                } catch (Exception ignored) {
                }
            }
            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(e.getMessage()));
        } catch (AccessDeniedException | SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    private UserDetailsImpl getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated principal is missing");
        }

        Object principal = authentication.getPrincipal();
        if (!(principal instanceof UserDetailsImpl)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Authenticated principal is invalid: " + principal.getClass().getName());
        }

        return (UserDetailsImpl) principal;
    }
}