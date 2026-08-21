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
import com.tripnest.dto.ResetPasswordRequest;
import com.tripnest.service.PasswordResetService;

@CrossOrigin(origins = "*", maxAge = 3600)
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

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        User user = userRepository.findByUsername(loginRequest.getUsername())
                .orElseGet(() -> userRepository.findByEmail(loginRequest.getUsername()).orElse(null));

        if (user != null && user.isPasswordChangeRequired() && user.getTemporaryPasswordExpiry() != null) {
            if (java.time.LocalDateTime.now().isAfter(user.getTemporaryPasswordExpiry())) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                        .body(new MessageResponse("Error: Temporary password has expired. Please request a new password reset."));
            }
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication.getName());

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<String> roles = userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority())
                .collect(Collectors.toList());

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

        Set<String> strRoles = signUpRequest.getRoles();
        Set<Role> roles = new HashSet<>();

        if (strRoles == null) {
            Role travelerRole = roleRepository.findByName(ERole.ROLE_TRAVELER)
                    .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
            roles.add(travelerRole);
        } else {
            strRoles.forEach(role -> {
                switch (role) {
                    case "group_admin":
                        Role groupAdminRole = roleRepository.findByName(ERole.ROLE_GROUP_ADMIN)
                                .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
                        roles.add(groupAdminRole);
                        break;
                    default:
                        Role travelerRole = roleRepository.findByName(ERole.ROLE_TRAVELER)
                                .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
                        roles.add(travelerRole);
                }
            });
        }

        user.setRoles(roles);
        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        try {
            passwordResetService.createResetToken(request.getEmail());
            return ResponseEntity.ok(new MessageResponse("If this email exists, a reset token has been generated. Check server logs for now."));
        } catch (RuntimeException e) {
            logger.error("Failed to process password reset request: {}", e.getMessage(), e);
            // Security best practice: same generic message chahe email exist kare ya na kare
            return ResponseEntity.ok(new MessageResponse("If this email exists, a reset token has been generated. Check server logs for now."));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
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
}