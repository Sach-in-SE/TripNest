package com.tripnest.controller;

import com.tripnest.dto.TravelPreferenceRequest;
import com.tripnest.dto.TravelPreferenceResponse;
import com.tripnest.security.UserDetailsImpl;
import com.tripnest.service.TravelPreferenceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/preferences")
public class TravelPreferenceController {

    @Autowired
    private TravelPreferenceService travelPreferenceService;

    @GetMapping
    public ResponseEntity<?> getPreferences() {
        UserDetailsImpl userDetails = getCurrentUser();
        TravelPreferenceResponse response = travelPreferenceService.getPreferences(userDetails.getId());
        return ResponseEntity.ok(response);
    }

    @PutMapping
    public ResponseEntity<?> createOrUpdatePreferences(@RequestBody TravelPreferenceRequest request) {
        UserDetailsImpl userDetails = getCurrentUser();
        TravelPreferenceResponse response = travelPreferenceService.createOrUpdatePreferences(request, userDetails.getId());
        return ResponseEntity.ok(response);
    }

    private UserDetailsImpl getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (UserDetailsImpl) authentication.getPrincipal();
    }
}
