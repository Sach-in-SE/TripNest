package com.tripnest.controller;

import com.tripnest.dto.ItineraryRequest;
import com.tripnest.dto.ItineraryResponse;
import com.tripnest.dto.MessageResponse;
import com.tripnest.security.UserDetailsImpl;
import com.tripnest.service.ItineraryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/itineraries")
public class ItineraryController {

    @Autowired
    private ItineraryService itineraryService;

    @PostMapping
    public ResponseEntity<?> createItinerary(@RequestBody ItineraryRequest request) {
        UserDetailsImpl userDetails = getCurrentUser();
        ItineraryResponse response = itineraryService.createItinerary(request, userDetails.getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/trip/{tripId}")
    public ResponseEntity<?> getTripItineraries(@PathVariable Long tripId) {
        UserDetailsImpl userDetails = getCurrentUser();
        List<ItineraryResponse> itineraries = itineraryService.getTripItineraries(tripId, userDetails.getId());
        return ResponseEntity.ok(itineraries);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateItinerary(@PathVariable Long id,
            @RequestBody ItineraryRequest request) {
        UserDetailsImpl userDetails = getCurrentUser();
        ItineraryResponse response = itineraryService.updateItinerary(id, request, userDetails.getId());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteItinerary(@PathVariable Long id) {
        UserDetailsImpl userDetails = getCurrentUser();
        itineraryService.deleteItinerary(id, userDetails.getId());
        return ResponseEntity.ok(new MessageResponse("Itinerary deleted successfully!"));
    }

    private UserDetailsImpl getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (UserDetailsImpl) authentication.getPrincipal();
    }
}