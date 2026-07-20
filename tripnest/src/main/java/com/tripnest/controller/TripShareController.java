package com.tripnest.controller;

import com.tripnest.dto.MessageResponse;
import com.tripnest.dto.RespondRequest;
import com.tripnest.dto.TripShareRequest;
import com.tripnest.dto.TripShareResponse;
import com.tripnest.security.UserDetailsImpl;
import com.tripnest.service.TripShareService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/trip-shares")
public class TripShareController {

    @Autowired
    private TripShareService tripShareService;

    /**
     * POST /api/trip-shares
     * Original share endpoint — now internally creates a PENDING invitation
     * (kept for backward-compat with ShareTripModal which calls this URL).
     */
    @PostMapping
    public ResponseEntity<?> shareTrip(@RequestBody TripShareRequest request) {
        UserDetailsImpl userDetails = getCurrentUser();
        TripShareResponse response = tripShareService.inviteUser(request, userDetails.getId());
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/trip-shares/invite
     * Explicit invite endpoint (same logic, separate URL as per spec).
     */
    @PostMapping("/invite")
    public ResponseEntity<?> inviteUser(@RequestBody TripShareRequest request) {
        UserDetailsImpl userDetails = getCurrentUser();
        TripShareResponse response = tripShareService.inviteUser(request, userDetails.getId());
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/trip-shares/{shareId}/respond
     * The invited user accepts or declines the invitation.
     * Body: { "action": "ACCEPT" | "DECLINE" }
     */
    @PostMapping("/{shareId}/respond")
    public ResponseEntity<?> respondToInvitation(
            @PathVariable Long shareId,
            @RequestBody RespondRequest request) {
        UserDetailsImpl userDetails = getCurrentUser();
        TripShareResponse response = tripShareService.respondToInvitation(
                shareId, request.getAction(), userDetails.getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/trip/{tripId}")
    public ResponseEntity<?> getTripShares(@PathVariable Long tripId) {
        UserDetailsImpl userDetails = getCurrentUser();
        List<TripShareResponse> shares = tripShareService.getTripShares(tripId, userDetails.getId());
        return ResponseEntity.ok(shares);
    }

    @GetMapping("/shared-with-me")
    public ResponseEntity<?> getTripsSharedWithMe() {
        UserDetailsImpl userDetails = getCurrentUser();
        List<TripShareResponse> shares = tripShareService.getTripsSharedWithMe(userDetails.getId());
        return ResponseEntity.ok(shares);
    }

    @DeleteMapping("/trip/{tripId}/user/{userId}")
    public ResponseEntity<?> removeShare(@PathVariable Long tripId, @PathVariable Long userId) {
        UserDetailsImpl userDetails = getCurrentUser();
        tripShareService.removeShare(tripId, userId, userDetails.getId());
        return ResponseEntity.ok(new MessageResponse("Share access removed successfully!"));
    }

    private UserDetailsImpl getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (UserDetailsImpl) authentication.getPrincipal();
    }
}