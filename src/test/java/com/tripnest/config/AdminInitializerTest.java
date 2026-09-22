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
        ReflectionTestUtils.setField(adminInitializer, "adminEmail", "customadmin@tripnest.com");
        ReflectionTestUtils.setField(adminInitializer, "adminUsername", "customadmin");
        ReflectionTestUtils.setField(adminInitializer, "adminPassword", "SecretEnvPassword123!");

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
        when(userRepository.findByEmailIgnoreCase("customadmin@tripnest.com")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("customadmin@tripnest.com")).thenReturn(Optional.empty());
        when(userRepository.findByUsername("customadmin")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("SecretEnvPassword123!")).thenReturn("encodedSecretEnvPassword");

        adminInitializer.run();

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());

        User savedAdmin = userCaptor.getValue();
        assertEquals("customadmin", savedAdmin.getUsername());
        assertEquals("customadmin@tripnest.com", savedAdmin.getEmail());
        assertEquals("encodedSecretEnvPassword", savedAdmin.getPassword());
        assertTrue(savedAdmin.isEnabled());
        assertTrue(savedAdmin.getRoles().contains(adminRole));
    }

    @Test
    void testRun_WhenAdminAlreadyExistsWithChangedPassword_PreservesPasswordAndEnsuresRoleAndEnabled() throws Exception {
        User existingAdmin = new User();
        existingAdmin.setId(1L);
        existingAdmin.setUsername("customadmin");
        existingAdmin.setEmail("customadmin@tripnest.com");
        existingAdmin.setPassword("userModifiedPasswordHash");
        existingAdmin.setEnabled(false);

        when(userRepository.findByEmailIgnoreCase("customadmin@tripnest.com")).thenReturn(Optional.of(existingAdmin));

        adminInitializer.run();

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());

        User updatedAdmin = userCaptor.getValue();
        assertEquals("userModifiedPasswordHash", updatedAdmin.getPassword());
        assertTrue(updatedAdmin.isEnabled());
        assertTrue(updatedAdmin.getRoles().contains(adminRole));
    }

    @Test
    void testRun_WhenAdminAlreadyExistsAndUpToDate_DoesNotSaveAgain() throws Exception {
        User upToDateAdmin = new User();
        upToDateAdmin.setId(1L);
        upToDateAdmin.setUsername("customadmin");
        upToDateAdmin.setEmail("customadmin@tripnest.com");
        upToDateAdmin.setPassword("currentEncodedPassword");
        upToDateAdmin.setEnabled(true);
        Set<Role> roles = new HashSet<>();
        roles.add(adminRole);
        upToDateAdmin.setRoles(roles);

        when(userRepository.findByEmailIgnoreCase("customadmin@tripnest.com")).thenReturn(Optional.of(upToDateAdmin));

        adminInitializer.run();

        verify(userRepository, never()).save(any(User.class));
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
        ReflectionTestUtils.setField(adminInitializer, "adminPassword", "AStrongSecureProdPassword2026!");
        when(userRepository.findByEmailIgnoreCase("customadmin@tripnest.com")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("customadmin@tripnest.com")).thenReturn(Optional.empty());
        when(userRepository.findByUsername("customadmin")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("AStrongSecureProdPassword2026!")).thenReturn("encodedProdPassword");

        assertDoesNotThrow(() -> adminInitializer.run());
        verify(userRepository).save(any(User.class));
    }
}
