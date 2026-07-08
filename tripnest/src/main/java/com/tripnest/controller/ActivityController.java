package com.tripnest.controller;

import com.tripnest.dto.ActivityRequest;
import com.tripnest.dto.ActivityResponse;
import com.tripnest.dto.MessageResponse;
import com.tripnest.security.UserDetailsImpl;
import com.tripnest.service.ActivityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/activities")
public class ActivityController {

    @Autowired
    private ActivityService activityService;

    @PostMapping
    public ResponseEntity<?> createActivity(@RequestBody ActivityRequest request) {
        UserDetailsImpl userDetails = getCurrentUser();
        ActivityResponse response = activityService.createActivity(request, userDetails.getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/itinerary/{itineraryId}")
    public ResponseEntity<?> getItineraryActivities(@PathVariable Long itineraryId) {
        UserDetailsImpl userDetails = getCurrentUser();
        List<ActivityResponse> activities = activityService.getItineraryActivities(itineraryId, userDetails.getId());
        return ResponseEntity.ok(activities);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateActivity(@PathVariable Long id,
            @RequestBody ActivityRequest request) {
        UserDetailsImpl userDetails = getCurrentUser();
        ActivityResponse response = activityService.updateActivity(id, request, userDetails.getId());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteActivity(@PathVariable Long id) {
        UserDetailsImpl userDetails = getCurrentUser();
        activityService.deleteActivity(id, userDetails.getId());
        return ResponseEntity.ok(new MessageResponse("Activity deleted successfully!"));
    }

    private UserDetailsImpl getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (UserDetailsImpl) authentication.getPrincipal();
    }
}