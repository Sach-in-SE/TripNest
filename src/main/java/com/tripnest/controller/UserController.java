package com.tripnest.controller;

import com.tripnest.dto.ChangePasswordRequest;
import com.tripnest.dto.ChangeUsernameRequest;
import com.tripnest.dto.JwtResponse;
import com.tripnest.dto.MessageResponse;
import com.tripnest.dto.ProfilePictureResponse;
import com.tripnest.dto.UpdateProfileRequest;
import com.tripnest.dto.UserProfileResponse;
import com.tripnest.entity.User;
import com.tripnest.service.UserService;
import com.tripnest.security.JwtUtils;
import com.tripnest.security.UserDetailsImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtils jwtUtils;

    @GetMapping("/profile")
    public ResponseEntity<?> getUserProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        User user = userService.getUserById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserProfileResponse response = new UserProfileResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setPhone(user.getPhone());
        response.setProfilePictureUrl(user.getProfilePictureUrl());
        response.setBio(user.getBio());
        response.setCountry(user.getCountry());
        response.setState(user.getState());
        response.setCity(user.getCity());
        response.setDateOfBirth(user.getDateOfBirth());
        response.setGender(user.getGender());
        response.setOccupation(user.getOccupation());
        response.setEmailVerified(user.isEmailVerified());
        response.setCreatedAt(user.getCreatedAt());
        response.setTravelStyle(user.getTravelStyle());
        response.setPreferredTransport(user.getPreferredTransport());
        response.setAccommodationPreference(user.getAccommodationPreference());
        response.setDreamDestination(user.getDreamDestination());
        response.setFavoriteDestination(user.getFavoriteDestination());
        response.setPassportHolder(user.isPassportHolder());
        response.setEmergencyContactName(user.getEmergencyContactName());
        response.setEmergencyContactRelationship(user.getEmergencyContactRelationship());
        response.setEmergencyContactPhone(user.getEmergencyContactPhone());
        response.setGithub(user.getGithub());
        response.setLinkedin(user.getLinkedin());
        response.setInstagram(user.getInstagram());
        response.setPortfolio(user.getPortfolio());
        response.setProvider(user.getProvider().name());
        response.setEnabled(user.isEnabled());
        response.setRoles(userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority())
                .collect(Collectors.toList()));

        return ResponseEntity.ok(response);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateUserProfile(
            @Valid @RequestBody UpdateProfileRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        User user = userService.getUserById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setBio(request.getBio());
        user.setCountry(request.getCountry());
        user.setState(request.getState());
        user.setCity(request.getCity());
        user.setDateOfBirth(request.getDateOfBirth());
        user.setGender(request.getGender());
        user.setOccupation(request.getOccupation());
        user.setTravelStyle(request.getTravelStyle());
        user.setPreferredTransport(request.getPreferredTransport());
        user.setAccommodationPreference(request.getAccommodationPreference());
        user.setDreamDestination(request.getDreamDestination());
        user.setFavoriteDestination(request.getFavoriteDestination());
        if (request.getPassportHolder() != null) {
            user.setPassportHolder(request.getPassportHolder());
        }
        user.setEmergencyContactName(request.getEmergencyContactName());
        user.setEmergencyContactRelationship(request.getEmergencyContactRelationship());
        user.setEmergencyContactPhone(request.getEmergencyContactPhone());
        user.setGithub(request.getGithub());
        user.setLinkedin(request.getLinkedin());
        user.setInstagram(request.getInstagram());
        user.setPortfolio(request.getPortfolio());

        userService.updateUser(user);

        return ResponseEntity.ok(new MessageResponse("Profile updated successfully!"));
    }

    @PostMapping("/profile-picture")
    public ResponseEntity<?> uploadProfilePicture(@RequestParam("file") MultipartFile file) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(new MessageResponse("File is empty"));
            }

            if (file.getSize() > 2 * 1024 * 1024) {
                return ResponseEntity.badRequest().body(new MessageResponse("File size exceeds 2MB limit"));
            }

            String contentType = file.getContentType();
            if (contentType == null || (!contentType.equals("image/jpeg") &&
                !contentType.equals("image/jpg") &&
                !contentType.equals("image/png"))) {
                return ResponseEntity.badRequest().body(new MessageResponse("Only JPG, JPEG, and PNG formats are allowed"));
            }

            ProfilePictureResponse response = userService.uploadProfilePicture(file, userDetails.getId());
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(new MessageResponse("File upload failed: " + e.getMessage()));
        }
    }

    @DeleteMapping("/profile-picture")
    public ResponseEntity<?> removeProfilePicture() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

            userService.removeProfilePicture(userDetails.getId());
            return ResponseEntity.ok(new MessageResponse("Profile picture removed successfully!"));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(new MessageResponse("Failed to remove profile picture: " + e.getMessage()));
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            return ResponseEntity.badRequest().body(new MessageResponse("New password and confirm password do not match"));
        }

        try {
            userService.changePassword(userDetails.getId(), request.getCurrentPassword(), request.getNewPassword());
            return ResponseEntity.ok(new MessageResponse("Password changed successfully!"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PutMapping("/username")
    public ResponseEntity<?> changeUsername(@Valid @RequestBody ChangeUsernameRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        User user = userService.getUserById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if username is already taken by another user
        if (userService.existsByUsername(request.getUsername()) && 
            !request.getUsername().equals(user.getUsername())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Username is already taken"));
        }

        try {
            user.setUsername(request.getUsername());
            userService.updateUser(user);
            
            // Generate new JWT token with updated username as subject
            String newToken = jwtUtils.generateJwtToken(user.getUsername());
            
            JwtResponse response = new JwtResponse(
                newToken,
                user.getId(),
                user.getUsername(),
                "Bearer",
                userDetails.getAuthorities().stream()
                    .map(item -> item.getAuthority())
                    .collect(Collectors.toList())
            );
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
}