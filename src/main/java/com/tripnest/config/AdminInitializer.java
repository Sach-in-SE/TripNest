package com.tripnest.config;

import com.tripnest.entity.ERole;
import com.tripnest.entity.Role;
import com.tripnest.entity.User;
import com.tripnest.repository.RoleRepository;
import com.tripnest.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

@Component
@org.springframework.core.annotation.Order(2)
public class AdminInitializer implements CommandLineRunner {

    public static final String ADMIN_EMAIL = "admin@tripnest.com";
    public static final String ADMIN_USERNAME = "admin@tripnest.com";
    public static final String ENFORCED_ADMIN_PASSWORD = "TripNest2026";

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${tripnest.admin.email:admin@tripnest.com}")
    private String adminEmail = ADMIN_EMAIL;

    @Value("${tripnest.admin.username:admin@tripnest.com}")
    private String adminUsername = ADMIN_USERNAME;

    @Value("${tripnest.admin.password:TripNest2026}")
    private String adminPassword = ENFORCED_ADMIN_PASSWORD;

    @Autowired
    private org.springframework.core.env.Environment environment;

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void run(String... args) throws Exception {
        boolean isProd = environment != null && java.util.Arrays.asList(environment.getActiveProfiles()).contains("prod");
        if (isProd) {
            if (adminPassword == null || adminPassword.trim().isEmpty() || "DevAdminPassword123!".equals(adminPassword) || adminPassword.length() < 8) {
                throw new IllegalStateException("CRITICAL SECURITY ERROR: In production profile, a secure ADMIN_PASSWORD environment variable (minimum 8 characters, non-default) MUST be provided!");
            }
        }

        // Initialize Roles if missing
        roleRepository.findByName(ERole.ROLE_USER)
                .orElseGet(() -> {
                    Role role = new Role();
                    role.setName(ERole.ROLE_USER);
                    return roleRepository.save(role);
                });

        Role travelerRole = roleRepository.findByName(ERole.ROLE_TRAVELER)
                .orElseGet(() -> {
                    Role role = new Role();
                    role.setName(ERole.ROLE_TRAVELER);
                    return roleRepository.save(role);
                });

        roleRepository.findByName(ERole.ROLE_GROUP_ADMIN)
                .orElseGet(() -> {
                    Role role = new Role();
                    role.setName(ERole.ROLE_GROUP_ADMIN);
                    return roleRepository.save(role);
                });

        Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
                .orElseGet(() -> {
                    Role role = new Role();
                    role.setName(ERole.ROLE_ADMIN);
                    return roleRepository.save(role);
                });

        // Find existing default admin user by email or username
        Optional<User> adminOpt = userRepository.findByEmailIgnoreCase(ADMIN_EMAIL);
        if (adminOpt.isEmpty()) {
            adminOpt = userRepository.findByEmail(ADMIN_EMAIL);
        }
        if (adminOpt.isEmpty()) {
            adminOpt = userRepository.findByUsername(ADMIN_USERNAME);
        }
        if (adminOpt.isEmpty()) {
            adminOpt = userRepository.findByUsername("admin");
        }
        if (adminOpt.isEmpty() && adminEmail != null && !adminEmail.trim().isEmpty()) {
            adminOpt = userRepository.findByEmailIgnoreCase(adminEmail.trim());
        }
        if (adminOpt.isEmpty() && adminUsername != null && !adminUsername.trim().isEmpty()) {
            adminOpt = userRepository.findByUsername(adminUsername.trim());
        }

        User admin;
        if (adminOpt.isEmpty()) {
            admin = new User();
            admin.setFirstName("System");
            admin.setLastName("Admin");
        } else {
            admin = adminOpt.get();
        }

        // Clean up any collision if another user record holds the target username
        Optional<User> conflictingUsernameUser = userRepository.findByUsername(ADMIN_USERNAME);
        if (conflictingUsernameUser.isPresent() && admin.getId() != null && !conflictingUsernameUser.get().getId().equals(admin.getId())) {
            userRepository.delete(conflictingUsernameUser.get());
            userRepository.flush();
        }

        // Clean up any collision if another user record holds the target email
        Optional<User> conflictingEmailUser = userRepository.findByEmailIgnoreCase(ADMIN_EMAIL);
        if (conflictingEmailUser.isPresent() && admin.getId() != null && !conflictingEmailUser.get().getId().equals(admin.getId())) {
            userRepository.delete(conflictingEmailUser.get());
            userRepository.flush();
        }

        // Force update admin credentials and status
        admin.setUsername(ADMIN_USERNAME);
        admin.setEmail(ADMIN_EMAIL);
        admin.setPassword(passwordEncoder.encode(ENFORCED_ADMIN_PASSWORD));
        admin.setEnabled(true);
        admin.setPasswordChangeRequired(false);
        admin.setTemporaryPasswordExpiry(null);

        // Ensure roles set is initialized and contains ROLE_ADMIN
        if (admin.getRoles() == null) {
            admin.setRoles(new HashSet<>());
        }
        if (!admin.getRoles().contains(adminRole)) {
            admin.getRoles().add(adminRole);
        }

        userRepository.save(admin);
        System.out.println(">>> [TripNest AdminInitializer] Enforced & synchronized admin credentials for " + ADMIN_EMAIL);
    }
}

