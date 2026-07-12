package com.tripnest.service;

import com.tripnest.entity.PasswordResetToken;
import com.tripnest.entity.User;
import com.tripnest.repository.PasswordResetTokenRepository;
import com.tripnest.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class PasswordResetService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public void createResetToken(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No account found with this email"));

        // Purana koi token hai toh hata do (ek user ke liye ek hi active token)
        tokenRepository.deleteByUserId(user.getId());

        String token = UUID.randomUUID().toString();

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUser(user);
        tokenRepository.save(resetToken);

        // TODO: Email bhejna hai yahan baad mein — abhi ke liye console mein print
        System.out.println("=================================================");
        System.out.println("PASSWORD RESET TOKEN for " + email + ": " + token);
        System.out.println("Use this token in POST /api/auth/reset-password");
        System.out.println("=================================================");
    }

    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired token"));

        if (resetToken.isExpired()) {
            throw new RuntimeException("Token has expired. Please request a new one.");
        }

        if (resetToken.isUsed()) {
            throw new RuntimeException("This token has already been used.");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        resetToken.setUsed(true);
        tokenRepository.save(resetToken);
    }
}