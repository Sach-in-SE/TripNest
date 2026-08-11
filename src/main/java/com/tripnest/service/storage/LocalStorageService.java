package com.tripnest.service.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service("localStorageService")
public class LocalStorageService implements StorageService {

    @Value("${tripnest.upload.dir:uploads}")
    private String uploadDir;

    @Override
    public String storeFile(MultipartFile file, String storedFileName) throws IOException {
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        Path targetPath = uploadPath.resolve(storedFileName).normalize();

        // Path Traversal Security Verification
        if (!targetPath.startsWith(uploadPath)) {
            throw new SecurityException("Cannot store file outside specified target directory.");
        }

        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        return storedFileName;
    }

    @Override
    public Resource loadFileAsResource(String storedFileName) throws IOException {
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path filePath = uploadPath.resolve(storedFileName).normalize();

        // Path Traversal Security Verification
        if (!filePath.startsWith(uploadPath)) {
            throw new SecurityException("Cannot access file outside upload directory.");
        }

        Resource resource = new UrlResource(filePath.toUri());
        if (resource.exists() && resource.isReadable()) {
            return resource;
        } else {
            throw new IOException("File not found or not readable: " + storedFileName);
        }
    }

    @Override
    public void deleteFile(String storedFileName) throws IOException {
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path filePath = uploadPath.resolve(storedFileName).normalize();

        // Path Traversal Security Verification
        if (!filePath.startsWith(uploadPath)) {
            throw new SecurityException("Cannot delete file outside upload directory.");
        }

        Files.deleteIfExists(filePath);
    }

    @Override
    public String getStorageType() {
        return "LOCAL";
    }
}
