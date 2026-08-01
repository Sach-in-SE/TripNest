package com.tripnest.controller;

import com.tripnest.dto.MessageResponse;
import com.tripnest.dto.TripRequest;
import com.tripnest.dto.TripResponse;
import com.tripnest.dto.TravelHistoryResponse;
import com.tripnest.security.UserDetailsImpl;
import com.tripnest.service.TripService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/trips")
public class TripController {

    @Autowired
    private TripService tripService;

    @PostMapping
    public ResponseEntity<?> createTrip(@Valid @RequestBody TripRequest request) {
        UserDetailsImpl userDetails = getCurrentUser();
        TripResponse response = tripService.createTrip(request, userDetails.getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<?> getUserTrips() {
        UserDetailsImpl userDetails = getCurrentUser();
        List<TripResponse> trips = tripService.getUserTrips(userDetails.getId());
        return ResponseEntity.ok(trips);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTripById(@PathVariable Long id) {
        UserDetailsImpl userDetails = getCurrentUser();
        TripResponse response = tripService.getTripById(id, userDetails.getId());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTrip(@PathVariable Long id,
            @Valid @RequestBody TripRequest request) {
        UserDetailsImpl userDetails = getCurrentUser();
        TripResponse response = tripService.updateTrip(id, request, userDetails.getId());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTrip(@PathVariable Long id) {
        UserDetailsImpl userDetails = getCurrentUser();
        tripService.deleteTrip(id, userDetails.getId());
        return ResponseEntity.ok(new MessageResponse("Trip deleted successfully!"));
    }

    @GetMapping("/history")
    public ResponseEntity<?> getTravelHistory() {
        UserDetailsImpl userDetails = getCurrentUser();
        TravelHistoryResponse response = tripService.getTravelHistory(userDetails.getId());
        return ResponseEntity.ok(response);
    }

    private UserDetailsImpl getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (UserDetailsImpl) authentication.getPrincipal();
    }
}