package com.tripnest.service;

import com.tripnest.entity.PasswordResetToken;
import com.tripnest.entity.User;
import com.tripnest.repository.PasswordResetTokenRepository;
import com.tripnest.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordResetTokenRepository tokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private PasswordResetService passwordResetService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setUsername("testuser");
        testUser.setPassword("oldpassword");
    }

    @Test
    void testCreateResetToken_WithValidEmail_CreatesTokenAndSendsEmail() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(tokenRepository.save(any(PasswordResetToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        passwordResetService.createResetToken("test@example.com");

        verify(userRepository).findByEmail("test@example.com");
        verify(tokenRepository).deleteByUserId(1L);
        verify(tokenRepository).save(any(PasswordResetToken.class));
        verify(emailService).sendPasswordResetEmail(eq("test@example.com"), anyString());
    }

    @Test
    void testCreateResetToken_WithInvalidEmail_ThrowsException() {
        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> {
            passwordResetService.createResetToken("nonexistent@example.com");
        });

        verify(emailService, never()).sendPasswordResetEmail(anyString(), anyString());
    }

    @Test
    void testResetPassword_WithValidToken_ResetsPassword() {
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken("valid-token");
        resetToken.setUser(testUser);
        resetToken.setUsed(false);
        // Set expiry date to future to ensure token is not expired
        resetToken.setExpiryDate(java.time.LocalDateTime.now().plusHours(1));

        when(tokenRepository.findByToken("valid-token")).thenReturn(Optional.of(resetToken));
        when(passwordEncoder.encode("newpassword")).thenReturn("encoded-newpassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(tokenRepository.save(any(PasswordResetToken.class))).thenReturn(resetToken);

        passwordResetService.resetPassword("valid-token", "newpassword");

        verify(passwordEncoder).encode("newpassword");
        verify(userRepository).save(testUser);
        assertTrue(resetToken.isUsed());
        verify(tokenRepository).save(resetToken);
    }

    @Test
    void testResetPassword_WithInvalidToken_ThrowsException() {
        when(tokenRepository.findByToken("invalid-token")).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> {
            passwordResetService.resetPassword("invalid-token", "newpassword");
        });

        verify(passwordEncoder, never()).encode(anyString());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void testResetPassword_WithExpiredToken_ThrowsException() {
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken("expired-token");
        resetToken.setUser(testUser);
        // Create a token that will be expired by manipulating the expiry date
        // Since we can't directly set expiry, we'll mock the isExpired method
        PasswordResetToken spiedToken = spy(resetToken);
        doReturn(true).when(spiedToken).isExpired();

        when(tokenRepository.findByToken("expired-token")).thenReturn(Optional.of(spiedToken));

        assertThrows(RuntimeException.class, () -> {
            passwordResetService.resetPassword("expired-token", "newpassword");
        });

        verify(passwordEncoder, never()).encode(anyString());
    }

    @Test
    void testResetPassword_WithUsedToken_ThrowsException() {
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken("used-token");
        resetToken.setUser(testUser);
        resetToken.setUsed(true);

        when(tokenRepository.findByToken("used-token")).thenReturn(Optional.of(resetToken));

        assertThrows(RuntimeException.class, () -> {
            passwordResetService.resetPassword("used-token", "newpassword");
        });

        verify(passwordEncoder, never()).encode(anyString());
    }
}