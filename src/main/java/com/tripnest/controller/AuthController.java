package com.tripnest.controller;

import com.tripnest.dto.JwtResponse;
import com.tripnest.dto.LoginRequest;
import com.tripnest.dto.MessageResponse;
import com.tripnest.dto.SignupRequest;
import com.tripnest.entity.ERole;
import com.tripnest.entity.Role;
import com.tripnest.entity.User;
import com.tripnest.repository.RoleRepository;
import com.tripnest.repository.UserRepository;
import com.tripnest.security.JwtUtils;
import com.tripnest.security.UserDetailsImpl;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import com.tripnest.dto.ForgotPasswordRequest;
import com.tripnest.dto.OAuth2ExchangeRequest;
import com.tripnest.dto.ResetPasswordRequest;
import com.tripnest.security.oauth2.OAuth2ExchangeCodeService;
import com.tripnest.service.PasswordResetService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    RoleRepository roleRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @Autowired
    private PasswordResetService passwordResetService;

    @Autowired
    private com.tripnest.service.DisposableEmailService disposableEmailService;

    @Autowired
    private OAuth2ExchangeCodeService oAuth2ExchangeCodeService;

    @Autowired(required = false)
    private com.tripnest.service.NotificationService notificationService;

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        String loginIdentifier = loginRequest.getUsername() != null ? loginRequest.getUsername().trim() : "";
        User user = userRepository.findByUsernameOrEmailWithRoles(loginIdentifier)
                .orElseGet(() -> userRepository.findByUsernameIgnoreCase(loginIdentifier)
                        .orElseGet(() -> userRepository.findByEmailIgnoreCase(loginIdentifier).orElse(null)));

        if (user != null && user.isPasswordChangeRequired() && user.getTemporaryPasswordExpiry() != null) {
            if (java.time.LocalDateTime.now().isAfter(user.getTemporaryPasswordExpiry())) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                        .body(new MessageResponse("Error: Temporary password has expired. Please request a new password reset."));
            }
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginIdentifier,
                        loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String jwt = jwtUtils.generateJwtToken(userDetails.getUsername());

        List<String> roles = new java.util.ArrayList<>();
        try {
            if (user != null && user.getRoles() != null && !user.getRoles().isEmpty()) {
                roles = user.getRoles().stream()
                        .filter(r -> r != null && r.getName() != null)
                        .map(r -> r.getName().name())
                        .collect(Collectors.toList());
            }
        } catch (Exception ignored) {
            // Guard against uninitialized lazy collection or detached entity
        }

        if (roles.isEmpty() && userDetails != null && userDetails.getAuthorities() != null) {
            roles = userDetails.getAuthorities().stream()
                    .map(item -> item.getAuthority())
                    .collect(Collectors.toList());
        }

        if (roles.isEmpty()) {
            roles = List.of(ERole.ROLE_USER.name(), ERole.ROLE_TRAVELER.name());
        }

        boolean passwordChangeRequired = (user != null) && user.isPasswordChangeRequired();

        return ResponseEntity.ok(new JwtResponse(jwt,
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getEmail(),
                roles,
                passwordChangeRequired));
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Username is already taken!"));
        }

        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Email is already in use!"));
        }

        // Check for disposable email domains
        if (disposableEmailService.isDisposableEmail(signUpRequest.getEmail())) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Disposable email addresses are not allowed. Please use a permanent email address."));
        }

        User user = new User();
        user.setUsername(signUpRequest.getUsername());
        user.setEmail(signUpRequest.getEmail());
        user.setPassword(encoder.encode(signUpRequest.getPassword()));
        user.setFirstName(signUpRequest.getFirstName());
        user.setLastName(signUpRequest.getLastName());
        user.setPhone(signUpRequest.getPhone());

        // Determine requested role from signUpRequest.getRole() or signUpRequest.getRoles()
        String requestedRole = null;
        if (signUpRequest.getRole() != null && !signUpRequest.getRole().isBlank()) {
            requestedRole = signUpRequest.getRole().trim();
        } else if (signUpRequest.getRoles() != null && !signUpRequest.getRoles().isEmpty()) {
            requestedRole = signUpRequest.getRoles().iterator().next().trim();
        }

        ERole assignedERole;
        if (requestedRole == null || requestedRole.isBlank()) {
            // 1. Default role: newly registered user has ROLE_USER
            assignedERole = ERole.ROLE_USER;
        } else {
            String normalized = requestedRole.toUpperCase();
            // Check for unauthorized admin role attempts (case-insensitive)
            boolean attemptsAdmin = normalized.equals("ADMIN") || normalized.equals("ROLE_ADMIN")
                    || (signUpRequest.getRoles() != null && signUpRequest.getRoles().stream()
                            .anyMatch(r -> r.toUpperCase().contains("ADMIN") && !r.toUpperCase().contains("GROUP_ADMIN")));

            if (attemptsAdmin) {
                // 4. Signup attempting ROLE_ADMIN -> rejected
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Error: Admin role cannot be requested through public registration."));
            } else if (normalized.equals("GROUP_ADMIN") || normalized.equals("ROLE_GROUP_ADMIN")) {
                // 3. Signup as Group Admin -> creates ROLE_GROUP_ADMIN
                assignedERole = ERole.ROLE_GROUP_ADMIN;
            } else if (normalized.equals("TRAVELER") || normalized.equals("ROLE_TRAVELER")
                    || normalized.equals("USER") || normalized.equals("ROLE_USER")) {
                // 2. Signup as Traveler -> creates ROLE_USER
                assignedERole = ERole.ROLE_USER;
            } else {
                // 5. Signup with an invalid/unknown role -> safely defaults to ROLE_USER
                assignedERole = ERole.ROLE_USER;
            }
        }

        Role roleEntity = roleRepository.findByName(assignedERole)
                .orElseGet(() -> {
                    Role r = new Role();
                    r.setName(assignedERole);
                    return roleRepository.save(r);
                });

        Set<Role> roles = new HashSet<>();
        roles.add(roleEntity);
        user.setRoles(roles);
        User savedUser = userRepository.save(user);

        if (notificationService != null) {
            try {
                notificationService.createDefaultPreferences(savedUser);
            } catch (Exception ignored) {
                // Non-blocking preference initialization
            }
        }

        return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            passwordResetService.createResetToken(request.getEmail());
            return ResponseEntity.ok(new MessageResponse("If this email is registered, a password reset link has been sent to your email address."));
        } catch (RuntimeException e) {
            logger.error("Failed to process password reset request: {}", e.getMessage(), e);
            // Security best practice: same generic message regardless of email existence
            return ResponseEntity.ok(new MessageResponse("If this email is registered, a password reset link has been sent to your email address."));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            passwordResetService.resetPassword(request.getToken(), request.getNewPassword());
            return ResponseEntity.ok(new MessageResponse("Password reset successfully!"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @GetMapping("/check-username")
    public ResponseEntity<?> checkUsernameAvailability(@RequestParam String username) {
        if (username == null || username.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Username is required"));
        }

        boolean isAvailable = !userRepository.existsByUsername(username.trim());
        return ResponseEntity.ok(new MessageResponse(isAvailable ? "Username is available" : "Username is already taken"));
    }

    @PostMapping("/oauth2/exchange")
    public ResponseEntity<?> exchangeOAuthCode(@Valid @RequestBody OAuth2ExchangeRequest request) {
        String username = oAuth2ExchangeCodeService.consumeExchangeCode(request.getCode());
        if (username == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                    .body(new MessageResponse("Error: Invalid or expired OAuth exchange code"));
        }

        User user = userRepository.findByUsernameOrEmailWithRoles(username)
                .orElseGet(() -> userRepository.findByUsernameIgnoreCase(username)
                        .orElseGet(() -> userRepository.findByEmailIgnoreCase(username)
                                .orElseThrow(() -> new RuntimeException("User not found"))));

        String jwt = jwtUtils.generateJwtToken(user.getUsername());
        List<String> roles = new java.util.ArrayList<>();
        try {
            if (user.getRoles() != null && !user.getRoles().isEmpty()) {
                roles = user.getRoles().stream()
                        .filter(r -> r != null && r.getName() != null)
                        .map(r -> r.getName().name())
                        .collect(Collectors.toList());
            }
        } catch (Exception ignored) {
            // Guard against uninitialized collection
        }

        if (roles.isEmpty()) {
            roles = List.of(ERole.ROLE_USER.name(), ERole.ROLE_TRAVELER.name());
        }

        return ResponseEntity.ok(new JwtResponse(jwt,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                roles,
                user.isPasswordChangeRequired()));
    }
}