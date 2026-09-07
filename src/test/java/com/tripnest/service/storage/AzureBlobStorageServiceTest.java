package com.tripnest.service.storage;

import com.azure.core.exception.HttpResponseException;
import com.azure.core.http.HttpResponse;
import com.azure.core.util.BinaryData;
import com.azure.core.util.Context;
import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.models.BlobStorageException;
import com.azure.storage.blob.options.BlobParallelUploadOptions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.Resource;
import org.springframework.mock.web.MockMultipartFile;

import java.io.FileNotFoundException;
import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AzureBlobStorageServiceTest {

    @Mock
    private BlobContainerClient blobContainerClient;

    @Mock
    private BlobClient blobClient;

    @Mock
    private HttpResponse httpResponse;

    private AzureBlobStorageService azureBlobStorageService;

    @BeforeEach
    void setUp() {
        azureBlobStorageService = new AzureBlobStorageService();
        azureBlobStorageService.setBlobContainerClient(blobContainerClient);
    }

    @Test
    @DisplayName("storeFile: Successfully uploads file with MIME/content type")
    void testStoreFile_Success() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.pdf",
                "application/pdf",
                "%PDF-1.4 sample content".getBytes()
        );

        when(blobContainerClient.getBlobClient("test-uuid.pdf")).thenReturn(blobClient);

        String result = azureBlobStorageService.storeFile(file, "test-uuid.pdf");

        assertEquals("test-uuid.pdf", result);
        ArgumentCaptor<BlobParallelUploadOptions> optionsCaptor = ArgumentCaptor.forClass(BlobParallelUploadOptions.class);
        verify(blobClient).uploadWithResponse(optionsCaptor.capture(), isNull(), eq(Context.NONE));

        BlobParallelUploadOptions captured = optionsCaptor.getValue();
        assertNotNull(captured);
        assertNotNull(captured.getHeaders());
        assertEquals("application/pdf", captured.getHeaders().getContentType());
    }

    @Test
    @DisplayName("storeFile: Rejects path traversal filenames")
    void testStoreFile_PathTraversalRejection() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "evil.pdf",
                "application/pdf",
                "content".getBytes()
        );

        assertThrows(SecurityException.class, () ->
                azureBlobStorageService.storeFile(file, "../test.pdf"));
        assertThrows(SecurityException.class, () ->
                azureBlobStorageService.storeFile(file, "sub/dir/test.pdf"));
        assertThrows(SecurityException.class, () ->
                azureBlobStorageService.storeFile(file, "sub\\test.pdf"));
    }

    @Test
    @DisplayName("loadFileAsResource: Successfully loads existing blob as readable Resource")
    void testLoadFileAsResource_Success() throws IOException {
        when(blobContainerClient.getBlobClient("my-doc.pdf")).thenReturn(blobClient);
        when(blobClient.exists()).thenReturn(true);
        when(blobClient.downloadContent()).thenReturn(BinaryData.fromString("Hello Azure Blob"));

        Resource resource = azureBlobStorageService.loadFileAsResource("my-doc.pdf");

        assertNotNull(resource);
        assertTrue(resource.exists());
        assertTrue(resource.isReadable());
        assertEquals("my-doc.pdf", resource.getFilename());
        try (java.io.InputStream is = resource.getInputStream()) {
            assertEquals("Hello Azure Blob", new String(is.readAllBytes()));
        }
    }

    @Test
    @DisplayName("loadFileAsResource: Throws FileNotFoundException when blob does not exist")
    void testLoadFileAsResource_MissingBlob() {
        when(blobContainerClient.getBlobClient("missing.pdf")).thenReturn(blobClient);
        when(blobClient.exists()).thenReturn(false);

        assertThrows(FileNotFoundException.class, () ->
                azureBlobStorageService.loadFileAsResource("missing.pdf"));
    }

    @Test
    @DisplayName("loadFileAsResource: Rejects path traversal filenames")
    void testLoadFileAsResource_PathTraversalRejection() {
        assertThrows(SecurityException.class, () ->
                azureBlobStorageService.loadFileAsResource("../outside.pdf"));
    }

    @Test
    @DisplayName("loadFileAsResource: Handles 404 BlobStorageException properly as FileNotFoundException")
    void testLoadFileAsResource_BlobStorageException404() {
        when(blobContainerClient.getBlobClient("blob-404.pdf")).thenReturn(blobClient);
        when(blobClient.exists()).thenReturn(true);

        when(httpResponse.getStatusCode()).thenReturn(404);
        BlobStorageException bse = new BlobStorageException("Blob not found", httpResponse, null);
        when(blobClient.downloadContent()).thenThrow(bse);

        assertThrows(FileNotFoundException.class, () ->
                azureBlobStorageService.loadFileAsResource("blob-404.pdf"));
    }

    @Test
    @DisplayName("deleteFile: Successfully deletes existing blob")
    void testDeleteFile_Success() throws IOException {
        when(blobContainerClient.getBlobClient("file-to-delete.jpg")).thenReturn(blobClient);
        when(blobClient.deleteIfExists()).thenReturn(true);

        azureBlobStorageService.deleteFile("file-to-delete.jpg");

        verify(blobClient).deleteIfExists();
    }

    @Test
    @DisplayName("deleteFile: Missing blob does not throw error")
    void testDeleteFile_MissingBlob_NoException() {
        when(blobContainerClient.getBlobClient("not-found.jpg")).thenReturn(blobClient);
        when(blobClient.deleteIfExists()).thenReturn(false);

        assertDoesNotThrow(() -> azureBlobStorageService.deleteFile("not-found.jpg"));
    }

    @Test
    @DisplayName("deleteFile: Rejects path traversal filenames")
    void testDeleteFile_PathTraversalRejection() {
        assertThrows(SecurityException.class, () ->
                azureBlobStorageService.deleteFile("../../file.jpg"));
    }

    @Test
    @DisplayName("getStorageType: Returns AZURE_BLOB")
    void testGetStorageType() {
        assertEquals("AZURE_BLOB", azureBlobStorageService.getStorageType());
    }

    @Test
    @DisplayName("Lazy initialization: Missing configuration throws IllegalStateException when accessed")
    void testClientInitialization_MissingConfigThrows() {
        AzureBlobStorageService unconfigured = new AzureBlobStorageService();

        MockMultipartFile file = new MockMultipartFile("file", "test.pdf", "application/pdf", "data".getBytes());

        IOException thrown = assertThrows(IOException.class, () ->
                unconfigured.storeFile(file, "test.pdf"));
        assertTrue(thrown.getCause() instanceof IllegalStateException || thrown.getMessage().contains("Azure Blob Storage"));
    }
}
