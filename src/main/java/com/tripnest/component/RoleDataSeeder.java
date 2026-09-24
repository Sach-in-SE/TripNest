package com.tripnest.component;

import com.tripnest.entity.ERole;
import com.tripnest.entity.Role;
import com.tripnest.repository.RoleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Initializes and ensures all canonical ERole enums are seeded in the database on startup.
 */
@Component
@Order(1)
public class RoleDataSeeder implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(RoleDataSeeder.class);

    @Autowired
    private RoleRepository roleRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        for (ERole erole : ERole.values()) {
            roleRepository.findByName(erole).orElseGet(() -> {
                logger.info("RoleDataSeeder: Seeding missing database role: {}", erole);
                Role role = new Role();
                role.setName(erole);
                return roleRepository.save(role);
            });
        }
    }
}
