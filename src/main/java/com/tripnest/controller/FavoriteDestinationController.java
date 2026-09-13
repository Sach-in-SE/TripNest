package com.tripnest.controller;

import com.tripnest.dto.FavoriteDestinationRequest;
import com.tripnest.dto.FavoriteDestinationResponse;
import com.tripnest.dto.MessageResponse;
import com.tripnest.security.UserDetailsImpl;
import com.tripnest.service.FavoriteDestinationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/favorites")
public class FavoriteDestinationController {

    @Autowired
    private FavoriteDestinationService favoriteDestinationService;

    @PostMapping
    public ResponseEntity<?> addFavorite(@RequestBody FavoriteDestinationRequest request) {
        Long userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageResponse("Authentication required."));
        }
        FavoriteDestinationResponse response = favoriteDestinationService.addFavorite(request, userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<?> getUserFavorites() {
        Long userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageResponse("Authentication required."));
        }
        List<FavoriteDestinationResponse> favorites = favoriteDestinationService.getUserFavorites(userId);
        return ResponseEntity.ok(favorites);
    }

    @DeleteMapping("/{destinationId}")
    public ResponseEntity<?> removeFavorite(@PathVariable Long destinationId) {
        Long userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageResponse("Authentication required."));
        }
        favoriteDestinationService.removeFavorite(destinationId, userId);
        return ResponseEntity.ok(new MessageResponse("Destination removed from favorites"));
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
            return ((UserDetailsImpl) authentication.getPrincipal()).getId();
        }
        return null;
    }
}
