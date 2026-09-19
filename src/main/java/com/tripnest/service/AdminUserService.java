package com.tripnest.service;

import com.tripnest.dto.AdminResetPasswordResponse;
import com.tripnest.dto.AdminUserResponse;
import com.tripnest.entity.*;
import com.tripnest.exception.ResourceNotFoundException;
import com.tripnest.repository.*;
import com.tripnest.service.storage.StorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger logger = LoggerFactory.getLogger(AdminUserService.class);
    private static final String TEMP_PWD_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
    private static final SecureRandom RANDOM = new SecureRandom();

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private ItineraryRepository itineraryRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private BudgetRepository budgetRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private TravelMemoryRepository travelMemoryRepository;

    @Autowired
    private TravelMemoryImageRepository travelMemoryImageRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private GroupMemberRepository groupMemberRepository;

    @Autowired
    private GroupMessageRepository groupMessageRepository;

    @Autowired
    private TripShareRepository tripShareRepository;

    @Autowired
    private ContactMessageRepository contactMessageRepository;

    @Autowired
    private FavoriteDestinationRepository favoriteDestinationRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private NotificationPreferenceRepository notificationPreferenceRepository;

    @Autowired
    private TravelPreferenceRepository travelPreferenceRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private StorageService storageService;

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
    public org.springframework.data.domain.Page<AdminUserResponse> getUsers(String search, Boolean enabled, String roleStr, org.springframework.data.domain.Pageable pageable) {
        ERole role = null;
        if (roleStr != null && !roleStr.trim().isEmpty()) {
            role = parseRole(roleStr);
        }

        return userRepository.searchUsers(
                (search != null && !search.trim().isEmpty()) ? search.trim() : null,
                enabled,
                role,
                pageable
        ).map(this::mapToAdminUserResponse);
    }

    @Transactional(readOnly = true)
    public AdminUserResponse getUserById(Long id) {
        User user = userRepository.findByIdWithRoles(id)
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

    @Transactional
    public void deleteUser(Long targetUserId, Long currentAdminId) {
        if (targetUserId == null) {
            throw new IllegalArgumentException("User ID must not be null");
        }
        if (targetUserId.equals(currentAdminId)) {
            throw new IllegalArgumentException("Administrators cannot delete their own account");
        }

        User user = userRepository.findByIdWithRoles(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + targetUserId));

        boolean isTargetAdmin = user.getRoles() != null && user.getRoles().stream()
                .anyMatch(r -> r.getName() == ERole.ROLE_ADMIN);
        if (isTargetAdmin) {
            throw new IllegalArgumentException("Administrators cannot delete other administrator accounts");
        }

        boolean isDeletableRole = user.getRoles() != null && user.getRoles().stream()
                .anyMatch(r -> r.getName() == ERole.ROLE_USER || r.getName() == ERole.ROLE_TRAVELER || r.getName() == ERole.ROLE_GROUP_ADMIN);
        if (!isDeletableRole) {
            throw new IllegalArgumentException("Only Traveler and Group Admin accounts can be deleted");
        }

        logger.info("Admin {} initiating permanent cascading deletion of user {} (ID: {})",
                currentAdminId, user.getUsername(), targetUserId);

        // 1. Clean up Physical Files & DB records for User-owned Travel Memories
        List<TravelMemory> userMemories = travelMemoryRepository.findByUserIdOrderByCreatedAtDesc(targetUserId);
        for (TravelMemory memory : userMemories) {
            Set<String> filesToDelete = new HashSet<>();
            if (memory.getImages() != null) {
                for (TravelMemoryImage img : memory.getImages()) {
                    if (img.getStoredFileName() != null && !img.getStoredFileName().trim().isEmpty()) {
                        filesToDelete.add(img.getStoredFileName().trim());
                    }
                }
            }
            if (memory.getStoredFileName() != null && !memory.getStoredFileName().trim().isEmpty()) {
                filesToDelete.add(memory.getStoredFileName().trim());
            }

            for (String fName : filesToDelete) {
                try {
                    storageService.deleteFile(fName);
                } catch (Exception e) {
                    logger.warn("Failed to delete physical photo file {}: {}", fName, e.getMessage());
                }
            }
            travelMemoryImageRepository.deleteByTravelMemoryId(memory.getId());
        }
        travelMemoryRepository.deleteAll(userMemories);

        // 2. Clean up Physical Files & DB records for User-uploaded Travel Documents
        List<TravelDocument> userDocuments = documentRepository.findByUserId(targetUserId);
        for (TravelDocument doc : userDocuments) {
            deletePhysicalDocumentFile(doc);
        }
        documentRepository.deleteAll(userDocuments);

        // 3. Clean up User-owned Trips and all child entities
        List<Trip> userTrips = tripRepository.findByUserId(targetUserId);
        for (Trip trip : userTrips) {
            Long tripId = trip.getId();

            // 3a. Unlink memories referencing this trip
            travelMemoryRepository.nullifyTripReferences(tripId);

            // 3b. Delete trip documents (including physical files)
            List<TravelDocument> tripDocs = documentRepository.findByTripId(tripId);
            for (TravelDocument doc : tripDocs) {
                deletePhysicalDocumentFile(doc);
            }
            documentRepository.deleteAll(tripDocs);

            // 3c. Delete trip shares
            List<TripShare> tripShares = tripShareRepository.findByTripId(tripId);
            tripShareRepository.deleteAll(tripShares);

            // 3d. Delete trip expenses
            expenseRepository.deleteByTripId(tripId);

            // 3e. Delete trip budget
            budgetRepository.deleteByTripId(tripId);

            // 3f. Delete trip itineraries & activities
            List<Itinerary> itineraries = itineraryRepository.findByTripIdOrderByDateAsc(tripId);
            for (Itinerary itinerary : itineraries) {
                activityRepository.deleteByItineraryId(itinerary.getId());
            }
            itineraryRepository.deleteAll(itineraries);

            // 3g. Delete travel groups attached to this trip
            List<TravelGroup> tripGroups = groupRepository.findByTripId(tripId);
            for (TravelGroup group : tripGroups) {
                groupMessageRepository.deleteByTravelGroupId(group.getId());
                groupMemberRepository.deleteByTravelGroupId(group.getId());
                groupRepository.deleteGroupMemberJoinTableByGroupId(group.getId());
                groupRepository.delete(group);
            }

            // 3h. Delete the trip itself
            tripRepository.delete(trip);
        }

        // 4. Delete user-owned activities on shared/other trips
        activityRepository.deleteByUserId(targetUserId);

        // 5. Delete user-owned itineraries on shared/other trips
        List<Itinerary> userItineraries = itineraryRepository.findByUserId(targetUserId);
        for (Itinerary it : userItineraries) {
            activityRepository.deleteByItineraryId(it.getId());
        }
        itineraryRepository.deleteByUserId(targetUserId);

        // 6. Delete user expenses on other trips
        expenseRepository.deleteByUserId(targetUserId);

        // 7. Delete trip shares involving this user
        tripShareRepository.deleteByUserId(targetUserId);

        // 8. Group messages sent by user in any group
        groupMessageRepository.deleteBySenderId(targetUserId);

        // 9. Nullify inviter references where this user invited others
        groupMemberRepository.nullifyInviterReferences(targetUserId);

        // 10. Delete group memberships for this user
        groupMemberRepository.deleteByUserId(targetUserId);

        // 11. Remove user from group_members join table
        groupRepository.deleteGroupMemberJoinTableByUserId(targetUserId);

        // 12. Delete groups created by this user (standalone groups not tied to a trip)
        List<TravelGroup> createdGroups = groupRepository.findByCreatedById(targetUserId);
        for (TravelGroup group : createdGroups) {
            groupMessageRepository.deleteByTravelGroupId(group.getId());
            groupMemberRepository.deleteByTravelGroupId(group.getId());
            groupRepository.deleteGroupMemberJoinTableByGroupId(group.getId());
            groupRepository.delete(group);
        }

        // 13. Nullify contact message user references (preserve messages for audit/support)
        contactMessageRepository.nullifyUserReferences(targetUserId);

        // 14. Preferences
        travelPreferenceRepository.findByUserId(targetUserId).ifPresent(travelPreferenceRepository::delete);
        notificationPreferenceRepository.findByUserId(targetUserId).ifPresent(notificationPreferenceRepository::delete);

        // 15. Notifications
        notificationRepository.deleteByUserId(targetUserId);

        // 16. Favorite destinations
        favoriteDestinationRepository.deleteByUserId(targetUserId);

        // 17. Password reset tokens
        passwordResetTokenRepository.deleteByUserId(targetUserId);

        // 18. Clear user roles and delete user entity
        if (user.getRoles() != null) {
            user.getRoles().clear();
        }
        userRepository.saveAndFlush(user);
        userRepository.delete(user);

        logger.info("User {} (ID: {}) successfully deleted permanently by admin {}",
                user.getUsername(), targetUserId, currentAdminId);
    }

    private void deletePhysicalDocumentFile(TravelDocument doc) {
        if (doc == null) return;
        String storedFileName = doc.getStoredFileName();
        if (storedFileName == null || storedFileName.trim().isEmpty()) {
            String fileUrl = doc.getFileUrl();
            if (fileUrl != null && fileUrl.contains("/")) {
                storedFileName = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
            }
        }
        if (storedFileName != null && !storedFileName.trim().isEmpty()) {
            try {
                storageService.deleteFile(storedFileName.trim());
            } catch (Exception e) {
                logger.warn("Failed to delete physical document file {}: {}", storedFileName, e.getMessage());
            }
        }
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
