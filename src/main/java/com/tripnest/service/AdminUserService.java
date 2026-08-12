package com.tripnest.service;

import com.tripnest.dto.AdminResetPasswordResponse;
import com.tripnest.dto.AdminUserResponse;
import com.tripnest.entity.ERole;
import com.tripnest.entity.Role;
import com.tripnest.entity.User;
import com.tripnest.repository.RoleRepository;
import com.tripnest.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AdminUserService {

    private static final String TEMP_PWD_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
    private static final SecureRandom RANDOM = new SecureRandom();

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${tripnest.admin.temp-password-expiration-hours:24}")
    private int tempPasswordExpiryHours;

    @Transactional(readOnly = true)
    public List<AdminUserResponse> getUsers(String search, Boolean enabled, String roleStr) {
        ERole role = null;
        if (roleStr != null && !roleStr.trim().isEmpty()) {
            role = parseRole(roleStr);
        }

        List<User> users = userRepository.searchUsers(
                (search != null && !search.trim().isEmpty()) ? search.trim() : null,
                enabled,
                role
        );

        return users.stream()
                .map(this::mapToAdminUserResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AdminUserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        return mapToAdminUserResponse(user);
    }

    @Transactional
    public AdminUserResponse updateUserStatus(Long targetUserId, boolean enabled, Long currentAdminId) {
        if (targetUserId.equals(currentAdminId) && !enabled) {
            throw new IllegalArgumentException("Administrators cannot disable their own account");
        }

        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + targetUserId));

        user.setEnabled(enabled);
        User updated = userRepository.save(user);

        return mapToAdminUserResponse(updated);
    }

    @Transactional
    public AdminUserResponse updateUserRoles(Long targetUserId, Set<String> rolesStr, Long currentAdminId) {
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + targetUserId));

        Set<Role> roles = new HashSet<>();
        boolean containsAdmin = false;

        for (String rStr : rolesStr) {
            ERole eRole = parseRole(rStr);
            if (eRole == ERole.ROLE_ADMIN) {
                containsAdmin = true;
            }
            Role role = roleRepository.findByName(eRole)
                    .orElseGet(() -> {
                        Role newRole = new Role();
                        newRole.setName(eRole);
                        return roleRepository.save(newRole);
                    });
            roles.add(role);
        }

        if (targetUserId.equals(currentAdminId) && !containsAdmin) {
            throw new IllegalArgumentException("Administrators cannot remove the administrator role from their own account");
        }

        user.setRoles(roles);
        User updated = userRepository.save(user);

        return mapToAdminUserResponse(updated);
    }

    @Transactional
    public AdminResetPasswordResponse generateTemporaryPassword(Long targetUserId) {
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + targetUserId));

        String rawTempPassword = generateSecureRandomPassword(12);
        user.setPassword(passwordEncoder.encode(rawTempPassword));
        user.setPasswordChangeRequired(true);
        LocalDateTime expiry = LocalDateTime.now().plusHours(tempPasswordExpiryHours > 0 ? tempPasswordExpiryHours : 24);
        user.setTemporaryPasswordExpiry(expiry);
        userRepository.save(user);

        return new AdminResetPasswordResponse(
                user.getId(),
                user.getUsername(),
                rawTempPassword,
                expiry,
                "Temporary password generated successfully. User must change password on next login."
        );
    }

    public AdminUserResponse mapToAdminUserResponse(User user) {
        AdminUserResponse response = new AdminUserResponse();
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
        response.setEnabled(user.isEnabled());
        response.setEmailVerified(user.isEmailVerified());
        response.setPasswordChangeRequired(user.isPasswordChangeRequired());
        response.setTemporaryPasswordExpiry(user.getTemporaryPasswordExpiry());
        response.setProvider(user.getProvider() != null ? user.getProvider().name() : "LOCAL");
        response.setCreatedAt(user.getCreatedAt());

        if (user.getRoles() != null) {
            response.setRoles(user.getRoles().stream()
                    .map(r -> r.getName().name())
                    .collect(Collectors.toList()));
        }

        return response;
    }

    private String generateSecureRandomPassword(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(TEMP_PWD_CHARS.charAt(RANDOM.nextInt(TEMP_PWD_CHARS.length())));
        }
        return sb.toString();
    }

    private ERole parseRole(String roleStr) {
        String formatted = roleStr.trim().toUpperCase();
        if (!formatted.startsWith("ROLE_")) {
            formatted = "ROLE_" + formatted;
        }
        try {
            return ERole.valueOf(formatted);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid role specified: " + roleStr);
        }
    }
}
