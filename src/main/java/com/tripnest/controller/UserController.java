package com.tripnest.controller;

import com.tripnest.dto.ChangePasswordRequest;
import com.tripnest.dto.ChangeUsernameRequest;
import com.tripnest.dto.JwtResponse;
import com.tripnest.dto.MessageResponse;
import com.tripnest.dto.SwitchRoleRequest;
import com.tripnest.dto.UpdateProfileRequest;
import com.tripnest.dto.UserProfileResponse;
import com.tripnest.entity.ERole;
import com.tripnest.entity.Role;
import com.tripnest.entity.User;
import com.tripnest.repository.RoleRepository;
import com.tripnest.service.UserService;
import com.tripnest.security.JwtUtils;
import com.tripnest.security.UserDetailsImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping({"/api/user", "/api/users"})
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private com.tripnest.repository.UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private com.tripnest.service.DisposableEmailService disposableEmailService;

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

        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            String newEmail = request.getEmail().trim();
            if (user.getEmail() == null || !newEmail.equalsIgnoreCase(user.getEmail().trim())) {
                if (userRepository.findByEmailIgnoreCase(newEmail).isPresent()) {
                    return ResponseEntity.badRequest().body(new MessageResponse("Error: Email is already in use!"));
                }
                if (disposableEmailService.isDisposableEmail(newEmail)) {
                    return ResponseEntity.badRequest().body(new MessageResponse("Error: Disposable email addresses are not allowed. Please use a permanent email address."));
                }
                user.setEmail(newEmail);
            }
        }

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

    @RequestMapping(value = "/role", method = {RequestMethod.PUT, RequestMethod.POST})
    @Transactional
    public ResponseEntity<?> switchRole(@Valid @RequestBody SwitchRoleRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserDetailsImpl)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                    .body(new MessageResponse("User is not authenticated"));
        }
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        User user = userRepository.findByIdWithRoles(userDetails.getId())
                .orElseGet(() -> userService.getUserById(userDetails.getId())
                        .orElseThrow(() -> new RuntimeException("User not found")));

        // Ensure roles collection is initialized to prevent NullPointerException or LazyInitializationException
        if (user.getRoles() == null) {
            user.setRoles(new HashSet<>());
        }

        // Check if the current user has ROLE_ADMIN. Admin role cannot be modified via self-service.
        boolean isCurrentAdmin = user.getRoles().stream()
                .anyMatch(r -> r != null && r.getName() == ERole.ROLE_ADMIN);
        if (isCurrentAdmin) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Administrator role cannot be changed via self-service"));
        }

        String targetRoleStr = request.getRole() != null ? request.getRole().trim().toUpperCase() : "";
        ERole targetERole;
        if (targetRoleStr.contains("GROUP") || (targetRoleStr.contains("ADMIN") && !targetRoleStr.equals("ADMIN") && !targetRoleStr.equals("ROLE_ADMIN"))) {
            targetERole = ERole.ROLE_GROUP_ADMIN;
        } else if (targetRoleStr.contains("TRAVEL")) {
            targetERole = ERole.ROLE_TRAVELER;
        } else if ("ROLE_USER".equals(targetRoleStr) || "USER".equals(targetRoleStr)) {
            targetERole = ERole.ROLE_USER;
        } else if ("ROLE_ADMIN".equals(targetRoleStr) || "ADMIN".equals(targetRoleStr)) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Cannot switch to Administrator role"));
        } else {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Invalid role specified. Allowed roles: Traveler, Group Admin"));
        }

        Role newRole = roleRepository.findByName(targetERole)
                .orElseGet(() -> {
                    Role r = new Role();
                    r.setName(targetERole);
                    return roleRepository.save(r);
                });

        // Safely mutate existing persistent collection to avoid LazyInitializationException or orphan issues
        user.getRoles().clear();
        user.getRoles().add(newRole);
        user = userRepository.saveAndFlush(user);

        // Update current Spring Security context with newly loaded authorities
        UserDetailsImpl updatedUserDetails = UserDetailsImpl.build(user);
        UsernamePasswordAuthenticationToken newAuth = new UsernamePasswordAuthenticationToken(
                updatedUserDetails,
                authentication.getCredentials(),
                updatedUserDetails.getAuthorities()
        );
        SecurityContextHolder.getContext().setAuthentication(newAuth);

        // Generate fresh JWT token for seamless client authorization
        String newToken = jwtUtils.generateJwtToken(user.getUsername());
        List<String> rolesList = user.getRoles().stream()
                .map(r -> r.getName().name())
                .collect(Collectors.toList());

        JwtResponse response = new JwtResponse(
                newToken,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                rolesList,
                user.isPasswordChangeRequired()
        );
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());

        return ResponseEntity.ok(response);
    }
}