package com.tripnest.controller;

import com.tripnest.dto.GroupRequest;
import com.tripnest.dto.GroupResponse;
import com.tripnest.dto.MessageResponse;
import com.tripnest.security.UserDetailsImpl;
import com.tripnest.service.GroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/groups")
public class GroupController {

    @Autowired
    private GroupService groupService;

    @PostMapping
    public ResponseEntity<?> createGroup(@RequestBody GroupRequest request) {
        UserDetailsImpl userDetails = getCurrentUser();
        GroupResponse response = groupService.createGroup(request, userDetails.getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<?> getUserGroups() {
        UserDetailsImpl userDetails = getCurrentUser();
        List<GroupResponse> groups = groupService.getUserGroups(userDetails.getId());
        return ResponseEntity.ok(groups);
    }

    @GetMapping("/trip/{tripId}")
    public ResponseEntity<?> getTripGroups(@PathVariable Long tripId) {
        List<GroupResponse> groups = groupService.getTripGroups(tripId);
        return ResponseEntity.ok(groups);
    }

    @PostMapping("/{groupId}/members/{memberId}")
    public ResponseEntity<?> addMember(@PathVariable Long groupId, @PathVariable Long memberId) {
        UserDetailsImpl userDetails = getCurrentUser();
        GroupResponse response = groupService.addMember(groupId, memberId, userDetails.getId());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{groupId}")
    public ResponseEntity<?> deleteGroup(@PathVariable Long groupId) {
        UserDetailsImpl userDetails = getCurrentUser();
        groupService.deleteGroup(groupId, userDetails.getId());
        return ResponseEntity.ok(new MessageResponse("Group deleted successfully!"));
    }

    private UserDetailsImpl getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (UserDetailsImpl) authentication.getPrincipal();
    }
}