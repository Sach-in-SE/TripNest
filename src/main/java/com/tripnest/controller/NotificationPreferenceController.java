package com.tripnest.controller;

import com.tripnest.dto.NotificationPreferenceRequest;
import com.tripnest.dto.NotificationPreferenceResponse;
import com.tripnest.security.UserDetailsImpl;
import com.tripnest.service.NotificationPreferenceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/notification-preferences")
public class NotificationPreferenceController {

    @Autowired
    private NotificationPreferenceService notificationPreferenceService;

    @GetMapping
    public ResponseEntity<?> getPreferences() {
        UserDetailsImpl userDetails = getCurrentUser();
        NotificationPreferenceResponse response = notificationPreferenceService.getPreferences(userDetails.getId());
        return ResponseEntity.ok(response);
    }

    @PutMapping
    public ResponseEntity<?> createOrUpdatePreferences(@RequestBody NotificationPreferenceRequest request) {
        UserDetailsImpl userDetails = getCurrentUser();
        NotificationPreferenceResponse response = notificationPreferenceService.createOrUpdatePreferences(request, userDetails.getId());
        return ResponseEntity.ok(response);
    }

    private UserDetailsImpl getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (UserDetailsImpl) authentication.getPrincipal();
    }
}
