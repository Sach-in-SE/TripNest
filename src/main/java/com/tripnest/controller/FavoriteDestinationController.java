package com.tripnest.controller;

import com.tripnest.dto.FavoriteDestinationRequest;
import com.tripnest.dto.FavoriteDestinationResponse;
import com.tripnest.dto.MessageResponse;
import com.tripnest.security.UserDetailsImpl;
import com.tripnest.service.FavoriteDestinationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/favorites")
public class FavoriteDestinationController {

    @Autowired
    private FavoriteDestinationService favoriteDestinationService;

    @PostMapping
    public ResponseEntity<?> addFavorite(@RequestBody FavoriteDestinationRequest request) {
        UserDetailsImpl userDetails = getCurrentUser();
        FavoriteDestinationResponse response = favoriteDestinationService.addFavorite(request, userDetails.getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<?> getUserFavorites() {
        UserDetailsImpl userDetails = getCurrentUser();
        List<FavoriteDestinationResponse> favorites = favoriteDestinationService.getUserFavorites(userDetails.getId());
        return ResponseEntity.ok(favorites);
    }

    @DeleteMapping("/{destinationId}")
    public ResponseEntity<?> removeFavorite(@PathVariable Long destinationId) {
        UserDetailsImpl userDetails = getCurrentUser();
        favoriteDestinationService.removeFavorite(destinationId, userDetails.getId());
        return ResponseEntity.ok(new MessageResponse("Destination removed from favorites"));
    }

    private UserDetailsImpl getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (UserDetailsImpl) authentication.getPrincipal();
    }
}
