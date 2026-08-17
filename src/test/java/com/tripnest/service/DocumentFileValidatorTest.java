package com.tripnest.service;

import com.tripnest.service.storage.DocumentFileValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.*;

public class DocumentFileValidatorTest {

    private DocumentFileValidator validator;

    @BeforeEach
    void setUp() {
        validator = new DocumentFileValidator();
    }

    @Test
    @DisplayName("Valid PDF passes validation")
    void testValidPdf_Success() {
        byte[] pdfBytes = "%PDF-1.4 sample content".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "document.pdf", "application/pdf", pdfBytes);
        assertDoesNotThrow(() -> validator.validateFile(file));
    }

    @Test
    @DisplayName("Valid PNG passes validation")
    void testValidPng_Success() {
        byte[] pngBytes = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0};
        MockMultipartFile file = new MockMultipartFile("file", "image.png", "image/png", pngBytes);
        assertDoesNotThrow(() -> validator.validateFile(file));
    }

    @Test
    @DisplayName("Valid JPEG passes validation")
    void testValidJpeg_Success() {
        byte[] jpegBytes = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x00, 0x10};
        MockMultipartFile file = new MockMultipartFile("file", "photo.jpg", "image/jpeg", jpegBytes);
        assertDoesNotThrow(() -> validator.validateFile(file));
    }

    @Test
    @DisplayName("Empty file fails validation")
    void testEmptyFile_ThrowsException() {
        MockMultipartFile file = new MockMultipartFile("file", "empty.pdf", "application/pdf", new byte[0]);
        assertThrows(IllegalArgumentException.class, () -> validator.validateFile(file));
    }

    @Test
    @DisplayName("Oversized file (>10MB) fails validation")
    void testOversizedFile_ThrowsException() {
        byte[] largeBytes = new byte[10 * 1024 * 1024 + 1];
        largeBytes[0] = '%'; largeBytes[1] = 'P'; largeBytes[2] = 'D'; largeBytes[3] = 'F';
        MockMultipartFile file = new MockMultipartFile("file", "large.pdf", "application/pdf", largeBytes);
        assertThrows(IllegalArgumentException.class, () -> validator.validateFile(file));
    }

    @Test
    @DisplayName("Unsupported file extension (.exe) fails validation")
    void testDisallowedExtension_ThrowsException() {
        MockMultipartFile file = new MockMultipartFile("file", "script.exe", "application/x-msdownload", "test".getBytes());
        assertThrows(IllegalArgumentException.class, () -> validator.validateFile(file));
    }

    @Test
    @DisplayName("Filename with path traversal (../) fails validation")
    void testPathTraversal_ThrowsException() {
        MockMultipartFile file = new MockMultipartFile("file", "../../etc/passwd.pdf", "application/pdf", "%PDF-1.4 test".getBytes());
        assertThrows(SecurityException.class, () -> validator.validateFile(file));
    }

    @Test
    @DisplayName("Spoofed file (binary EXE with .pdf extension) fails validation")
    void testSpoofedExecutable_ThrowsException() {
        byte[] exeBytes = new byte[]{'M', 'Z', 0, 0, 0, 0};
        MockMultipartFile file = new MockMultipartFile("file", "malicious.pdf", "application/pdf", exeBytes);
        assertThrows(IllegalArgumentException.class, () -> validator.validateFile(file));
    }

    @Test
    @DisplayName("Valid image formats pass validateImageFile")
    void testValidateImageFile_Success() {
        byte[] jpegBytes = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x00};
        MockMultipartFile jpegFile = new MockMultipartFile("photo", "sunset.jpg", "image/jpeg", jpegBytes);
        assertDoesNotThrow(() -> validator.validateImageFile(jpegFile));

        byte[] pngBytes = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
        MockMultipartFile pngFile = new MockMultipartFile("photo", "peaks.png", "image/png", pngBytes);
        assertDoesNotThrow(() -> validator.validateImageFile(pngFile));
    }

    @Test
    @DisplayName("Non-image formats (PDF, DOCX) fail validateImageFile")
    void testValidateImageFile_RejectsNonImages() {
        byte[] pdfBytes = "%PDF-1.4 sample content".getBytes();
        MockMultipartFile pdfFile = new MockMultipartFile("photo", "doc.pdf", "application/pdf", pdfBytes);
        assertThrows(IllegalArgumentException.class, () -> validator.validateImageFile(pdfFile));
    }
}
