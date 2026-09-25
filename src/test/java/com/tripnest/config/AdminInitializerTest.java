package com.tripnest.config;

import com.tripnest.entity.ERole;
import com.tripnest.entity.Role;
import com.tripnest.entity.User;
import com.tripnest.repository.RoleRepository;
import com.tripnest.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminInitializerTest {

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private org.springframework.core.env.Environment environment;

    @InjectMocks
    private AdminInitializer adminInitializer;

    private Role adminRole;

    @BeforeEach
    void setUp() {
        lenient().when(environment.getActiveProfiles()).thenReturn(new String[]{"dev"});
        ReflectionTestUtils.setField(adminInitializer, "adminEmail", "admin@tripnest.com");
        ReflectionTestUtils.setField(adminInitializer, "adminUsername", "admin@tripnest.com");
        ReflectionTestUtils.setField(adminInitializer, "adminPassword", "TripNest2026");

        Role travelerRole = new Role();
        travelerRole.setName(ERole.ROLE_TRAVELER);
        Role groupAdminRole = new Role();
        groupAdminRole.setName(ERole.ROLE_GROUP_ADMIN);
        adminRole = new Role();
        adminRole.setName(ERole.ROLE_ADMIN);

        lenient().when(roleRepository.findByName(ERole.ROLE_TRAVELER)).thenReturn(Optional.of(travelerRole));
        lenient().when(roleRepository.findByName(ERole.ROLE_GROUP_ADMIN)).thenReturn(Optional.of(groupAdminRole));
        lenient().when(roleRepository.findByName(ERole.ROLE_ADMIN)).thenReturn(Optional.of(adminRole));
    }

    @Test
    void testRun_ProvisionsAdminUserUsingConfiguredCredentials_WhenNotPresent() throws Exception {
        when(userRepository.findByEmailIgnoreCase("admin@tripnest.com")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("admin@tripnest.com")).thenReturn(Optional.empty());
        when(userRepository.findByUsername("admin@tripnest.com")).thenReturn(Optional.empty());
        when(userRepository.findByUsername("admin")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("TripNest2026")).thenReturn("encodedTripNest2026");

        adminInitializer.run();

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());

        User savedAdmin = userCaptor.getValue();
        assertEquals("admin@tripnest.com", savedAdmin.getUsername());
        assertEquals("admin@tripnest.com", savedAdmin.getEmail());
        assertEquals("encodedTripNest2026", savedAdmin.getPassword());
        assertTrue(savedAdmin.isEnabled());
        assertFalse(savedAdmin.isPasswordChangeRequired());
        assertTrue(savedAdmin.getRoles().contains(adminRole));
    }

    @Test
    void testRun_WhenAdminAlreadyExists_ForcesPasswordUpdateAndEnsuresRoleAndEnabled() throws Exception {
        User existingAdmin = new User();
        existingAdmin.setId(1L);
        existingAdmin.setUsername("admin");
        existingAdmin.setEmail("admin@tripnest.com");
        existingAdmin.setPassword("oldOutdatedPasswordHash");
        existingAdmin.setEnabled(false);
        existingAdmin.setPasswordChangeRequired(true);

        when(userRepository.findByEmailIgnoreCase("admin@tripnest.com")).thenReturn(Optional.of(existingAdmin));
        when(passwordEncoder.encode("TripNest2026")).thenReturn("encodedTripNest2026");

        adminInitializer.run();

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());

        User updatedAdmin = userCaptor.getValue();
        assertEquals("admin@tripnest.com", updatedAdmin.getUsername());
        assertEquals("admin@tripnest.com", updatedAdmin.getEmail());
        assertEquals("encodedTripNest2026", updatedAdmin.getPassword());
        assertTrue(updatedAdmin.isEnabled());
        assertFalse(updatedAdmin.isPasswordChangeRequired());
        assertTrue(updatedAdmin.getRoles().contains(adminRole));
    }

    @Test
    void testRun_WhenProdProfile_AndAdminPasswordNull_ThrowsIllegalStateException() {
        when(environment.getActiveProfiles()).thenReturn(new String[]{"prod"});
        ReflectionTestUtils.setField(adminInitializer, "adminPassword", null);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> adminInitializer.run());
        assertTrue(ex.getMessage().contains("ADMIN_PASSWORD"));
    }

    @Test
    void testRun_WhenProdProfile_AndAdminPasswordEmpty_ThrowsIllegalStateException() {
        when(environment.getActiveProfiles()).thenReturn(new String[]{"prod"});
        ReflectionTestUtils.setField(adminInitializer, "adminPassword", "   ");

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> adminInitializer.run());
        assertTrue(ex.getMessage().contains("ADMIN_PASSWORD"));
    }

    @Test
    void testRun_WhenProdProfile_AndAdminPasswordIsDevDefault_ThrowsIllegalStateException() {
        when(environment.getActiveProfiles()).thenReturn(new String[]{"prod"});
        ReflectionTestUtils.setField(adminInitializer, "adminPassword", "DevAdminPassword123!");

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> adminInitializer.run());
        assertTrue(ex.getMessage().contains("ADMIN_PASSWORD"));
    }

    @Test
    void testRun_WhenProdProfile_AndAdminPasswordTooShort_ThrowsIllegalStateException() {
        when(environment.getActiveProfiles()).thenReturn(new String[]{"prod"});
        ReflectionTestUtils.setField(adminInitializer, "adminPassword", "short1!");

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> adminInitializer.run());
        assertTrue(ex.getMessage().contains("minimum 8 characters"));
    }

    @Test
    void testRun_WhenProdProfile_AndAdminPasswordSecure_Succeeds() throws Exception {
        when(environment.getActiveProfiles()).thenReturn(new String[]{"prod"});
        ReflectionTestUtils.setField(adminInitializer, "adminPassword", "TripNest2026");
        when(userRepository.findByEmailIgnoreCase("admin@tripnest.com")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("admin@tripnest.com")).thenReturn(Optional.empty());
        when(userRepository.findByUsername("admin@tripnest.com")).thenReturn(Optional.empty());
        when(userRepository.findByUsername("admin")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("TripNest2026")).thenReturn("encodedProdPassword");

        assertDoesNotThrow(() -> adminInitializer.run());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void testRun_WhenExceptionDuringPasswordSynchronization_HandlesGracefullyWithoutThrowing() throws Exception {
        when(userRepository.findByEmailIgnoreCase("admin@tripnest.com")).thenThrow(new RuntimeException("Database error during admin lookup"));

        assertDoesNotThrow(() -> adminInitializer.run());
    }
}
