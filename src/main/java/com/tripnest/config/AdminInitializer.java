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
public class AdminInitializer implements CommandLineRunner {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${tripnest.admin.email}")
    private String adminEmail;

    @Value("${tripnest.admin.username}")
    private String adminUsername;

    @Value("${tripnest.admin.password}")
    private String adminPassword;

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
        Optional<User> adminOpt = userRepository.findByEmailIgnoreCase(adminEmail);
        if (adminOpt.isEmpty()) {
            adminOpt = userRepository.findByEmail(adminEmail);
        }
        if (adminOpt.isEmpty()) {
            adminOpt = userRepository.findByUsername(adminUsername);
        }

        boolean needsSave = false;
        User admin;

        if (adminOpt.isEmpty()) {
            admin = new User();
            admin.setUsername(adminUsername);
            admin.setEmail(adminEmail);
            admin.setFirstName("System");
            admin.setLastName("Admin");
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setEnabled(true);
            needsSave = true;
        } else {
            admin = adminOpt.get();
        }

        // Ensure roles set is initialized and contains ROLE_ADMIN
        if (admin.getRoles() == null) {
            admin.setRoles(new HashSet<>());
        }
        if (!admin.getRoles().contains(adminRole)) {
            admin.getRoles().add(adminRole);
            needsSave = true;
        }

        // Ensure admin account is enabled
        if (!admin.isEnabled()) {
            admin.setEnabled(true);
            needsSave = true;
        }

        // Ensure account password is set if not already present
        if (admin.getPassword() == null) {
            admin.setPassword(passwordEncoder.encode(adminPassword));
            needsSave = true;
        }

        if (needsSave) {
            userRepository.save(admin);
            System.out.println(">>> [TripNest AdminInitializer] Provisioned/synchronized default administrator account (" + adminEmail + ")");
        }
    }
}

