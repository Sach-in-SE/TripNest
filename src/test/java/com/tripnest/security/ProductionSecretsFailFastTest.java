package com.tripnest.security;

import com.tripnest.config.AdminInitializer;
import com.tripnest.entity.ERole;
import com.tripnest.entity.Role;
import com.tripnest.repository.RoleRepository;
import com.tripnest.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ProductionSecretsFailFastTest {

    @Mock
    private Environment environment;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private JwtUtils jwtUtils;

    @InjectMocks
    private AdminInitializer adminInitializer;

    @Nested
    @DisplayName("JWT Secret Production Fail-Fast Tests")
    class JwtSecretValidationTests {

        @Test
        @DisplayName("Prod Profile: Null JWT Secret must throw IllegalStateException")
        void testProdProfile_NullJwtSecret_FailsFast() {
            when(environment.getActiveProfiles()).thenReturn(new String[]{"prod"});
            ReflectionTestUtils.setField(jwtUtils, "jwtSecret", null);

            IllegalStateException ex = assertThrows(IllegalStateException.class, () -> jwtUtils.validateJwtSecret());
            assertTrue(ex.getMessage().contains("JWT_SECRET"));
        }

        @Test
        @DisplayName("Prod Profile: Empty/Blank JWT Secret must throw IllegalStateException")
        void testProdProfile_EmptyJwtSecret_FailsFast() {
            when(environment.getActiveProfiles()).thenReturn(new String[]{"prod"});
            ReflectionTestUtils.setField(jwtUtils, "jwtSecret", "   ");

            IllegalStateException ex = assertThrows(IllegalStateException.class, () -> jwtUtils.validateJwtSecret());
            assertTrue(ex.getMessage().contains("JWT_SECRET"));
        }

        @Test
        @DisplayName("Prod Profile: Insecure Development Placeholder must throw IllegalStateException")
        void testProdProfile_DevelopmentPlaceholder_FailsFast() {
            when(environment.getActiveProfiles()).thenReturn(new String[]{"prod"});
            ReflectionTestUtils.setField(jwtUtils, "jwtSecret", "tripnest-development-only-change-me-secret-key-12345678901234567890");

            IllegalStateException ex = assertThrows(IllegalStateException.class, () -> jwtUtils.validateJwtSecret());
            assertTrue(ex.getMessage().contains("JWT_SECRET"));
        }

        @Test
        @DisplayName("Prod Profile: Too Short (< 32 characters) JWT Secret must throw IllegalStateException")
        void testProdProfile_TooShortJwtSecret_FailsFast() {
            when(environment.getActiveProfiles()).thenReturn(new String[]{"prod"});
            ReflectionTestUtils.setField(jwtUtils, "jwtSecret", "short_secret_under_32_chars");

            IllegalStateException ex = assertThrows(IllegalStateException.class, () -> jwtUtils.validateJwtSecret());
            assertTrue(ex.getMessage().contains("minimum 32 characters"));
        }

        @Test
        @DisplayName("Prod Profile: Cryptographically Strong JWT Secret (>= 32 characters) passes validation")
        void testProdProfile_ValidSecureSecret_Succeeds() {
            when(environment.getActiveProfiles()).thenReturn(new String[]{"prod"});
            ReflectionTestUtils.setField(jwtUtils, "jwtSecret", "a_very_secure_production_random_secret_string_with_sufficient_entropy_2026");

            assertDoesNotThrow(() -> jwtUtils.validateJwtSecret());
        }

        @Test
        @DisplayName("Dev Profile: Development secret is allowed in non-production environments")
        void testDevProfile_DevelopmentSecret_Allowed() {
            when(environment.getActiveProfiles()).thenReturn(new String[]{"dev"});
            ReflectionTestUtils.setField(jwtUtils, "jwtSecret", "tripnest-development-only-change-me-secret-key-12345678901234567890");

            assertDoesNotThrow(() -> jwtUtils.validateJwtSecret());
        }
    }

    @Nested
    @DisplayName("Admin Password Production Fail-Fast Tests")
    class AdminPasswordValidationTests {

        @BeforeEach
        void setUpRoles() {
            ReflectionTestUtils.setField(adminInitializer, "adminEmail", "admin@tripnest.com");
            ReflectionTestUtils.setField(adminInitializer, "adminUsername", "admin");

            Role adminRole = new Role();
            adminRole.setName(ERole.ROLE_ADMIN);
            Role travelerRole = new Role();
            travelerRole.setName(ERole.ROLE_TRAVELER);
            Role groupAdminRole = new Role();
            groupAdminRole.setName(ERole.ROLE_GROUP_ADMIN);

            lenient().when(roleRepository.findByName(ERole.ROLE_TRAVELER)).thenReturn(Optional.of(travelerRole));
            lenient().when(roleRepository.findByName(ERole.ROLE_GROUP_ADMIN)).thenReturn(Optional.of(groupAdminRole));
            lenient().when(roleRepository.findByName(ERole.ROLE_ADMIN)).thenReturn(Optional.of(adminRole));
        }

        @Test
        @DisplayName("Prod Profile: Null ADMIN_PASSWORD must throw IllegalStateException")
        void testProdProfile_NullAdminPassword_FailsFast() {
            when(environment.getActiveProfiles()).thenReturn(new String[]{"prod"});
            ReflectionTestUtils.setField(adminInitializer, "adminPassword", null);

            IllegalStateException ex = assertThrows(IllegalStateException.class, () -> adminInitializer.run());
            assertTrue(ex.getMessage().contains("ADMIN_PASSWORD"));
        }

        @Test
        @DisplayName("Prod Profile: Empty/Blank ADMIN_PASSWORD must throw IllegalStateException")
        void testProdProfile_EmptyAdminPassword_FailsFast() {
            when(environment.getActiveProfiles()).thenReturn(new String[]{"prod"});
            ReflectionTestUtils.setField(adminInitializer, "adminPassword", "   ");

            IllegalStateException ex = assertThrows(IllegalStateException.class, () -> adminInitializer.run());
            assertTrue(ex.getMessage().contains("ADMIN_PASSWORD"));
        }

        @Test
        @DisplayName("Prod Profile: Development Default 'DevAdminPassword123!' must throw IllegalStateException")
        void testProdProfile_DevDefaultPassword_FailsFast() {
            when(environment.getActiveProfiles()).thenReturn(new String[]{"prod"});
            ReflectionTestUtils.setField(adminInitializer, "adminPassword", "DevAdminPassword123!");

            IllegalStateException ex = assertThrows(IllegalStateException.class, () -> adminInitializer.run());
            assertTrue(ex.getMessage().contains("ADMIN_PASSWORD"));
        }

        @Test
        @DisplayName("Prod Profile: Short (< 8 characters) ADMIN_PASSWORD must throw IllegalStateException")
        void testProdProfile_ShortAdminPassword_FailsFast() {
            when(environment.getActiveProfiles()).thenReturn(new String[]{"prod"});
            ReflectionTestUtils.setField(adminInitializer, "adminPassword", "pass");

            IllegalStateException ex = assertThrows(IllegalStateException.class, () -> adminInitializer.run());
            assertTrue(ex.getMessage().contains("minimum 8 characters"));
        }

        @Test
        @DisplayName("Prod Profile: Secure ADMIN_PASSWORD succeeds in provisioning")
        void testProdProfile_SecureAdminPassword_Succeeds() throws Exception {
            when(environment.getActiveProfiles()).thenReturn(new String[]{"prod"});
            ReflectionTestUtils.setField(adminInitializer, "adminPassword", "AStrongProductionPassword2026#!");
            when(userRepository.findByEmailIgnoreCase("admin@tripnest.com")).thenReturn(Optional.empty());
            when(userRepository.findByEmail("admin@tripnest.com")).thenReturn(Optional.empty());
            when(userRepository.findByUsername("admin")).thenReturn(Optional.empty());
            when(passwordEncoder.encode("AStrongProductionPassword2026#!")).thenReturn("encodedHashValue");

            assertDoesNotThrow(() -> adminInitializer.run());
            verify(userRepository).save(any());
        }

        @Test
        @DisplayName("Dev Profile: Development password is permitted in non-production environments")
        void testDevProfile_DevDefaultPassword_Allowed() throws Exception {
            when(environment.getActiveProfiles()).thenReturn(new String[]{"dev"});
            ReflectionTestUtils.setField(adminInitializer, "adminPassword", "DevAdminPassword123!");
            when(userRepository.findByEmailIgnoreCase("admin@tripnest.com")).thenReturn(Optional.empty());
            when(userRepository.findByEmail("admin@tripnest.com")).thenReturn(Optional.empty());
            when(userRepository.findByUsername("admin")).thenReturn(Optional.empty());
            when(passwordEncoder.encode("DevAdminPassword123!")).thenReturn("encodedHashValue");

            assertDoesNotThrow(() -> adminInitializer.run());
            verify(userRepository).save(any());
        }
    }
}
