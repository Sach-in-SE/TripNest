package com.tripnest.service.storage;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DelegatingStorageServiceTest {

    @Mock
    private StorageService localStorageService;

    @Mock
    private StorageService s3CloudStorageService;

    @Mock
    private StorageService azureBlobStorageService;

    private DelegatingStorageService delegatingStorageService;

    @BeforeEach
    void setUp() {
        delegatingStorageService = new DelegatingStorageService();
        delegatingStorageService.setLocalStorageService(localStorageService);
        delegatingStorageService.setS3CloudStorageService(s3CloudStorageService);
        delegatingStorageService.setAzureBlobStorageService(azureBlobStorageService);
    }

    @Test
    @DisplayName("Provider selection: local is selected when STORAGE_TYPE=local")
    void testSelection_Local() {
        delegatingStorageService.setStorageType("local");
        assertSame(localStorageService, delegatingStorageService.getActiveStorageService());
    }

    @Test
    @DisplayName("Provider selection: local is default when STORAGE_TYPE is empty or null")
    void testSelection_DefaultIsLocal() {
        delegatingStorageService.setStorageType(null);
        assertSame(localStorageService, delegatingStorageService.getActiveStorageService());

        delegatingStorageService.setStorageType("");
        assertSame(localStorageService, delegatingStorageService.getActiveStorageService());
    }

    @Test
    @DisplayName("Provider selection: azure is selected when STORAGE_TYPE=azure")
    void testSelection_Azure() {
        delegatingStorageService.setStorageType("azure");
        assertSame(azureBlobStorageService, delegatingStorageService.getActiveStorageService());

        delegatingStorageService.setStorageType("AZURE");
        assertSame(azureBlobStorageService, delegatingStorageService.getActiveStorageService());

        delegatingStorageService.setStorageType("azure_blob");
        assertSame(azureBlobStorageService, delegatingStorageService.getActiveStorageService());
    }

    @Test
    @DisplayName("Provider selection: s3 is selected when STORAGE_TYPE=s3")
    void testSelection_S3() {
        delegatingStorageService.setStorageType("s3");
        assertSame(s3CloudStorageService, delegatingStorageService.getActiveStorageService());
    }

    @Test
    @DisplayName("Provider selection: S3 fallback when s3AccessKey is present and storageType is not local or azure")
    void testSelection_S3AccessKeyFallback() {
        delegatingStorageService.setStorageType(null);
        delegatingStorageService.setS3AccessKey("my-aws-access-key");
        assertSame(s3CloudStorageService, delegatingStorageService.getActiveStorageService());
    }

    @Test
    @DisplayName("Provider selection: local takes precedence when storageType is explicitly local even if s3AccessKey exists")
    void testSelection_LocalPrecedenceOverS3Key() {
        delegatingStorageService.setStorageType("local");
        delegatingStorageService.setS3AccessKey("my-aws-access-key");
        assertSame(localStorageService, delegatingStorageService.getActiveStorageService());
    }

    @Test
    @DisplayName("Provider selection: azure takes precedence when storageType is explicitly azure even if s3AccessKey exists")
    void testSelection_AzurePrecedenceOverS3Key() {
        delegatingStorageService.setStorageType("azure");
        delegatingStorageService.setS3AccessKey("my-aws-access-key");
        assertSame(azureBlobStorageService, delegatingStorageService.getActiveStorageService());
    }

    @Test
    @DisplayName("Provider selection: throws IllegalArgumentException for unsupported storage type")
    void testSelection_UnsupportedStorageType() {
        delegatingStorageService.setStorageType("unsupported_type");
        IllegalArgumentException thrown = assertThrows(IllegalArgumentException.class, () ->
                delegatingStorageService.getActiveStorageService());
        assertTrue(thrown.getMessage().contains("Unsupported storage type"));
    }

    @Test
    @DisplayName("Azure delegation: storeFile forwards call to AzureBlobStorageService")
    void testDelegation_StoreFile_Azure() throws IOException {
        delegatingStorageService.setStorageType("azure");
        MockMultipartFile file = new MockMultipartFile("file", "doc.pdf", "application/pdf", "data".getBytes());

        when(azureBlobStorageService.storeFile(file, "uuid-123.pdf")).thenReturn("uuid-123.pdf");

        String stored = delegatingStorageService.storeFile(file, "uuid-123.pdf");

        assertEquals("uuid-123.pdf", stored);
        verify(azureBlobStorageService).storeFile(file, "uuid-123.pdf");
        verifyNoInteractions(localStorageService, s3CloudStorageService);
    }

    @Test
    @DisplayName("Azure delegation: loadFileAsResource forwards call to AzureBlobStorageService")
    void testDelegation_LoadFileAsResource_Azure() throws IOException {
        delegatingStorageService.setStorageType("azure");
        Resource mockResource = new ByteArrayResource("content".getBytes());

        when(azureBlobStorageService.loadFileAsResource("uuid-123.pdf")).thenReturn(mockResource);

        Resource loaded = delegatingStorageService.loadFileAsResource("uuid-123.pdf");

        assertSame(mockResource, loaded);
        verify(azureBlobStorageService).loadFileAsResource("uuid-123.pdf");
        verifyNoInteractions(localStorageService, s3CloudStorageService);
    }

    @Test
    @DisplayName("Azure delegation: deleteFile forwards call to AzureBlobStorageService")
    void testDelegation_DeleteFile_Azure() throws IOException {
        delegatingStorageService.setStorageType("azure");

        delegatingStorageService.deleteFile("uuid-123.pdf");

        verify(azureBlobStorageService).deleteFile("uuid-123.pdf");
        verifyNoInteractions(localStorageService, s3CloudStorageService);
    }

    @Test
    @DisplayName("Azure delegation: getStorageType forwards call to AzureBlobStorageService")
    void testDelegation_GetStorageType_Azure() {
        delegatingStorageService.setStorageType("azure");
        when(azureBlobStorageService.getStorageType()).thenReturn("AZURE_BLOB");

        assertEquals("AZURE_BLOB", delegatingStorageService.getStorageType());
        verify(azureBlobStorageService).getStorageType();
    }

    @Test
    @DisplayName("Existing S3 behavior remains intact")
    void testDelegation_S3Operations() throws IOException {
        delegatingStorageService.setStorageType("s3");
        MockMultipartFile file = new MockMultipartFile("file", "s3.pdf", "application/pdf", "data".getBytes());

        when(s3CloudStorageService.storeFile(file, "s3-uuid.pdf")).thenReturn("s3-uuid.pdf");
        when(s3CloudStorageService.getStorageType()).thenReturn("S3_CLOUD");

        assertEquals("s3-uuid.pdf", delegatingStorageService.storeFile(file, "s3-uuid.pdf"));
        assertEquals("S3_CLOUD", delegatingStorageService.getStorageType());

        verify(s3CloudStorageService).storeFile(file, "s3-uuid.pdf");
        verify(s3CloudStorageService).getStorageType();
        verifyNoInteractions(localStorageService, azureBlobStorageService);
    }
}
