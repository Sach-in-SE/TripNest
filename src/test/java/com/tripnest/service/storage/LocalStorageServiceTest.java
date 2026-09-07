package com.tripnest.service.storage;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.Resource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

public class LocalStorageServiceTest {

    @TempDir
    Path tempUploadDir;

    private LocalStorageService localStorageService;

    @BeforeEach
    void setUp() {
        localStorageService = new LocalStorageService();
        ReflectionTestUtils.setField(localStorageService, "uploadDir", tempUploadDir.toString());
    }

    @Test
    @DisplayName("storeFile: Successfully stores file in local upload directory")
    void testStoreFile_Success() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file", "doc.pdf", "application/pdf", "Local Content".getBytes()
        );

        String stored = localStorageService.storeFile(file, "local-123.pdf");
        assertEquals("local-123.pdf", stored);

        Resource loaded = localStorageService.loadFileAsResource("local-123.pdf");
        assertTrue(loaded.exists());
        assertTrue(loaded.isReadable());
        try (java.io.InputStream is = loaded.getInputStream()) {
            assertEquals("Local Content", new String(is.readAllBytes()));
        }
    }

    @Test
    @DisplayName("storeFile: Rejects path traversal filenames")
    void testStoreFile_PathTraversal() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "doc.pdf", "application/pdf", "data".getBytes()
        );

        assertThrows(SecurityException.class, () ->
                localStorageService.storeFile(file, "../outside.pdf"));
    }

    @Test
    @DisplayName("loadFileAsResource: Throws IOException for non-existent file")
    void testLoadFileAsResource_NotFound() {
        assertThrows(IOException.class, () ->
                localStorageService.loadFileAsResource("non-existent.pdf"));
    }

    @Test
    @DisplayName("deleteFile: Deletes file successfully and is idempotent")
    void testDeleteFile() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file", "photo.jpg", "image/jpeg", "image data".getBytes()
        );

        localStorageService.storeFile(file, "photo-del.jpg");
        assertTrue(localStorageService.loadFileAsResource("photo-del.jpg").exists());

        localStorageService.deleteFile("photo-del.jpg");
        assertThrows(IOException.class, () ->
                localStorageService.loadFileAsResource("photo-del.jpg"));

        // Idempotent deletion does not throw
        assertDoesNotThrow(() -> localStorageService.deleteFile("photo-del.jpg"));
    }

    @Test
    @DisplayName("getStorageType: Returns LOCAL")
    void testGetStorageType() {
        assertEquals("LOCAL", localStorageService.getStorageType());
    }
}
