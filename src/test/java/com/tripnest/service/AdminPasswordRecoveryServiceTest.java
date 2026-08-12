package com.tripnest.service;

import com.tripnest.dto.AdminResetPasswordResponse;
import com.tripnest.entity.User;
import com.tripnest.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminPasswordRecoveryServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AdminUserService adminUserService;

    @InjectMocks
    private UserService userService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = new User();
        sampleUser.setId(5L);
        sampleUser.setUsername("testtraveler");
        sampleUser.setEmail("traveler@example.com");
        sampleUser.setPassword("encodedOldPassword");
        sampleUser.setEnabled(true);
    }

    @Test
    void testGenerateTemporaryPassword_SetsFlagAndExpiry() {
        when(userRepository.findById(5L)).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.encode(anyString())).thenReturn("encodedTempPassword");
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        AdminResetPasswordResponse response = adminUserService.generateTemporaryPassword(5L);

        assertNotNull(response);
        assertEquals(5L, response.getUserId());
        assertEquals("testtraveler", response.getUsername());
        assertNotNull(response.getTemporaryPassword());
        assertTrue(response.getTemporaryPassword().length() >= 12);
        assertNotNull(response.getTemporaryPasswordExpiry());
        assertTrue(response.getTemporaryPasswordExpiry().isAfter(LocalDateTime.now()));

        assertTrue(sampleUser.isPasswordChangeRequired());
        assertEquals("encodedTempPassword", sampleUser.getPassword());
        verify(userRepository).save(sampleUser);
    }

    @Test
    void testChangePassword_ClearsTemporaryPasswordState() {
        sampleUser.setPasswordChangeRequired(true);
        sampleUser.setTemporaryPasswordExpiry(LocalDateTime.now().plusHours(24));

        when(userRepository.findById(5L)).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("rawTempPassword", "encodedOldPassword")).thenReturn(true);
        when(passwordEncoder.encode("newSecretPassword123!")).thenReturn("encodedNewPassword");

        userService.changePassword(5L, "rawTempPassword", "newSecretPassword123!");

        assertFalse(sampleUser.isPasswordChangeRequired());
        assertNull(sampleUser.getTemporaryPasswordExpiry());
        assertEquals("encodedNewPassword", sampleUser.getPassword());
        verify(userRepository).save(sampleUser);
    }
}
