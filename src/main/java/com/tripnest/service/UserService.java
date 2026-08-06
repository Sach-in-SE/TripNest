package com.tripnest.service;

import com.tripnest.dto.ProfilePictureResponse;
import com.tripnest.entity.User;
import com.tripnest.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${tripnest.upload.dir:uploads}")
    private String uploadDir;

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public User updateUser(User user) {
        return userRepository.save(user);
    }

    public ProfilePictureResponse uploadProfilePicture(MultipartFile file, Long userId) throws IOException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Path uploadPath = Paths.get(uploadDir, "profile-pictures");
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String originalFileName = file.getOriginalFilename();
        String extension = "";
        if (originalFileName != null && originalFileName.contains(".")) {
            extension = originalFileName.substring(originalFileName.lastIndexOf("."));
        }
        String storedFileName = "profile_" + userId + "_" + UUID.randomUUID() + extension;

        Path targetPath = uploadPath.resolve(storedFileName);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        user.setProfilePictureUrl("/api/documents/download/profile-pictures/" + storedFileName);
        userRepository.save(user);

        ProfilePictureResponse response = new ProfilePictureResponse();
        response.setProfilePictureUrl(user.getProfilePictureUrl());
        return response;
    }

    public void removeProfilePicture(Long userId) throws IOException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getProfilePictureUrl() != null) {
            String storedFileName = user.getProfilePictureUrl().substring(user.getProfilePictureUrl().lastIndexOf("/") + 1);
            Path filePath = Paths.get(uploadDir, "profile-pictures").resolve(storedFileName);
            Files.deleteIfExists(filePath);

            user.setProfilePictureUrl(null);
            userRepository.save(user);
        }
    }

    public void changePassword(Long userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}