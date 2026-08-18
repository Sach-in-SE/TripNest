package com.tripnest.controller;

import com.tripnest.dto.DestinationDetailsResponse;
import com.tripnest.dto.DestinationRequest;
import com.tripnest.dto.DestinationResponse;
import com.tripnest.dto.MessageResponse;
import com.tripnest.service.DestinationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/destinations")
public class DestinationController {

    @Autowired
    private DestinationService destinationService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> createDestination(
            @Valid @RequestBody DestinationRequest request) {
        DestinationResponse response = destinationService.createDestination(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<?> getAllDestinations() {
        List<DestinationResponse> destinations = destinationService.getAllDestinations();
        return ResponseEntity.ok(destinations);
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchDestinations(@RequestParam String query) {
        List<DestinationResponse> destinations = destinationService.searchDestinations(query);
        return ResponseEntity.ok(destinations);
    }

    @GetMapping("/filter")
    public ResponseEntity<?> filterByCategory(@RequestParam String category) {
        List<DestinationResponse> destinations = destinationService.filterByCategory(category);
        return ResponseEntity.ok(destinations);
    }

    @GetMapping("/sort")
    public ResponseEntity<?> sortDestinations(@RequestParam String sortBy) {
        List<DestinationResponse> destinations = destinationService.sortDestinations(sortBy);
        return ResponseEntity.ok(destinations);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDestinationById(@PathVariable Long id) {
        DestinationDetailsResponse response = destinationService.getDestinationDetails(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/details")
    public ResponseEntity<?> getDestinationDetails(@PathVariable Long id) {
        DestinationDetailsResponse response = destinationService.getDestinationDetails(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/nearby")
    public ResponseEntity<?> getNearbyDestinations(
            @PathVariable Long id,
            @RequestParam(defaultValue = "4") int limit) {
        List<DestinationResponse> nearby = destinationService.getNearbyDestinations(id, limit);
        return ResponseEntity.ok(nearby);
    }

    @GetMapping("/{id}/raw")
    public ResponseEntity<?> getRawDestinationById(@PathVariable Long id) {
        DestinationResponse response = destinationService.getDestinationById(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> updateDestination(
            @PathVariable Long id,
            
            @Valid @RequestBody DestinationRequest request) {
        DestinationResponse response = destinationService.updateDestination(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> deleteDestination(@PathVariable Long id) {
        destinationService.deleteDestination(id);
        return ResponseEntity.ok(new MessageResponse("Destination deleted successfully!"));
    }
}