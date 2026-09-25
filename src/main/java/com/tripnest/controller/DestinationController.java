package com.tripnest.controller;

import com.tripnest.dto.DestinationDetailsResponse;
import com.tripnest.dto.DestinationRequest;
import com.tripnest.dto.DestinationResponse;
import com.tripnest.dto.MessageResponse;
import com.tripnest.dto.TravelMemoryResponse;
import com.tripnest.service.DestinationService;
import com.tripnest.service.TravelMemoryService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/destinations")
public class DestinationController {

    @Autowired
    private DestinationService destinationService;

    @Autowired
    private TravelMemoryService travelMemoryService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> createDestination(
            @Valid @RequestBody DestinationRequest request) {
        DestinationResponse response = destinationService.createDestination(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<?> getAllDestinations(
            @PageableDefault(size = 20, sort = "name") Pageable pageable) {
        Page<DestinationResponse> destinations = destinationService.getAllDestinations(pageable);
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

    @GetMapping("/{id}/raw")
    public ResponseEntity<?> getRawDestinationById(@PathVariable Long id) {
        DestinationResponse response = destinationService.getDestinationById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/image")
    public ResponseEntity<?> getDestinationImage(@PathVariable Long id) {
        java.util.Map<String, String> image = destinationService.getDestinationImageOnly(id);
        return ResponseEntity.ok(image);
    }

    @GetMapping("/{id}/weather")
    public ResponseEntity<?> getDestinationWeather(@PathVariable Long id) {
        return ResponseEntity.ok(destinationService.getDestinationWeather(id));
    }

    @GetMapping("/{id}/guide")
    public ResponseEntity<?> getDestinationGuide(@PathVariable Long id) {
        return ResponseEntity.ok(destinationService.getDestinationGuide(id));
    }

    @GetMapping("/{id}/wiki")
    public ResponseEntity<?> getDestinationWiki(@PathVariable Long id) {
        return ResponseEntity.ok(destinationService.getDestinationWiki(id));
    }

    @GetMapping("/{id}/experiences")
    public ResponseEntity<Page<TravelMemoryResponse>> getDestinationExperiences(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        int boundedSize = Math.max(1, Math.min(size, 50));
        int boundedPage = Math.max(0, page);
        Pageable pageable = PageRequest.of(boundedPage, boundedSize);
        Page<TravelMemoryResponse> experiences = travelMemoryService.getPublicMemoriesByDestination(id, pageable);
        return ResponseEntity.ok(experiences);
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