package com.tripnest.service.storage;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

@Component
public class DocumentFileValidator {

    private static final long MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

    private static final Set<String> ALLOWED_MIME_TYPES = new HashSet<>(Arrays.asList(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain"
    ));

    private static final Set<String> ALLOWED_EXTENSIONS = new HashSet<>(Arrays.asList(
            "jpg", "jpeg", "png", "webp", "pdf", "docx", "txt"
    ));

    public void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Invalid upload: File is empty or missing.");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("File size exceeds maximum allowed limit of 10MB.");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null) {
            String sanitizedName = originalFilename.trim();
            if (sanitizedName.contains("..") || sanitizedName.contains("/") || sanitizedName.contains("\\") || sanitizedName.contains("\0")) {
                throw new SecurityException("Illegal filename or path traversal detected.");
            }

            String ext = extractExtension(sanitizedName).toLowerCase();
            if (!ALLOWED_EXTENSIONS.contains(ext)) {
                throw new IllegalArgumentException("Unsupported file extension: ." + ext + ". Allowed formats: PDF, JPEG, PNG, WEBP, DOCX, TXT.");
            }
        }

        String contentType = file.getContentType();
        if (contentType != null && !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase().trim())) {
            throw new IllegalArgumentException("Unsupported MIME type: " + contentType + ". Allowed formats: PDF, JPEG, PNG, WEBP, DOCX, TXT.");
        }

        // Validate Magic Bytes header from input stream
        try (InputStream inputStream = file.getInputStream()) {
            byte[] header = new byte[16];
            int bytesRead = inputStream.read(header, 0, header.length);
            if (bytesRead > 0) {
                verifyMagicBytes(header, bytesRead, extractExtension(originalFilename));
            }
        } catch (IOException e) {
            throw new IllegalArgumentException("Failed to inspect file contents for security validation.", e);
        }
    }

    private void verifyMagicBytes(byte[] header, int length, String extension) {
        String ext = extension.toLowerCase();

        // PDF: %PDF- (0x25 0x50 0x44 0x46 0x2D)
        if ("pdf".equals(ext)) {
            if (length < 4 || header[0] != 0x25 || header[1] != 0x50 || header[2] != 0x44 || header[3] != 0x46) {
                throw new IllegalArgumentException("Invalid file format: File header does not match a valid PDF document.");
            }
            return;
        }

        // PNG: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
        if ("png".equals(ext)) {
            if (length < 4 || (header[0] & 0xFF) != 0x89 || header[1] != 0x50 || header[2] != 0x4E || header[3] != 0x47) {
                throw new IllegalArgumentException("Invalid file format: File header does not match a valid PNG image.");
            }
            return;
        }

        // JPEG: 0xFF 0xD8 0xFF
        if ("jpeg".equals(ext) || "jpg".equals(ext)) {
            if (length < 3 || (header[0] & 0xFF) != 0xFF || (header[1] & 0xFF) != 0xD8 || (header[2] & 0xFF) != 0xFF) {
                throw new IllegalArgumentException("Invalid file format: File header does not match a valid JPEG image.");
            }
            return;
        }

        // DOCX: PK.. (0x50 0x4B)
        if ("docx".equals(ext)) {
            if (length < 2 || header[0] != 0x50 || header[1] != 0x4B) {
                throw new IllegalArgumentException("Invalid file format: File header does not match a valid DOCX document.");
            }
            return;
        }

        // Executable / Script Guard: Reject MZ (Windows EXE/DLL), ELF (Linux ELF), script tags
        if (length >= 2 && header[0] == 'M' && header[1] == 'Z') {
            throw new SecurityException("Security violation: Executable files are not allowed.");
        }
        if (length >= 4 && (header[0] & 0xFF) == 0x7F && header[1] == 'E' && header[2] == 'L' && header[3] == 'F') {
            throw new SecurityException("Security violation: Executable files are not allowed.");
        }
    }

    private String extractExtension(String filename) {
        if (filename != null && filename.contains(".")) {
            return filename.substring(filename.lastIndexOf(".") + 1);
        }
        return "";
    }
}
