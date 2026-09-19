package com.tripnest.service.storage;

import com.amazonaws.AmazonClientException;
import com.amazonaws.AmazonServiceException;
import com.amazonaws.auth.AWSCredentials;
import com.amazonaws.auth.AWSCredentialsProvider;
import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.DefaultAWSCredentialsProviderChain;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.amazonaws.services.s3.model.AmazonS3Exception;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.S3Object;
import com.amazonaws.services.s3.model.S3ObjectInputStream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.Resource;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class S3CloudStorageServiceTest {

    @Mock
    private AmazonS3 amazonS3;

    private S3CloudStorageService s3CloudStorageService;

    @BeforeEach
    void setUp() {
        s3CloudStorageService = new S3CloudStorageService();
        s3CloudStorageService.setS3Client(amazonS3);
        s3CloudStorageService.setBucketName("test-bucket");
        s3CloudStorageService.setRegion("eu-central-1");
    }

    // ---------------------------------------------------------------------------------------------
    // 1. Credential Behavior Tests
    // ---------------------------------------------------------------------------------------------
    @Test
    @DisplayName("Credential handling: Explicit static access and secret key uses AWSStaticCredentialsProvider")
    void testCredentials_ExplicitStaticCredentials() {
        S3CloudStorageService service = new S3CloudStorageService();
        service.setAccessKey("AKIAIOSFODNN7EXAMPLE");
        service.setSecretKey("wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY");

        AWSCredentialsProvider provider = service.resolveCredentialsProvider();

        assertNotNull(provider);
        assertInstanceOf(AWSStaticCredentialsProvider.class, provider);
        AWSCredentials credentials = provider.getCredentials();
        assertEquals("AKIAIOSFODNN7EXAMPLE", credentials.getAWSAccessKeyId());
        assertEquals("wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY", credentials.getAWSSecretKey());
    }

    @Test
    @DisplayName("Credential handling: Missing or empty access/secret keys uses DefaultAWSCredentialsProviderChain")
    void testCredentials_DefaultCredentialProviderChain() {
        S3CloudStorageService service = new S3CloudStorageService();
        service.setAccessKey("");
        service.setSecretKey("");

        AWSCredentialsProvider provider = service.resolveCredentialsProvider();

        assertNotNull(provider);
        assertInstanceOf(DefaultAWSCredentialsProviderChain.class, provider);

        // Test with null credentials as well
        service.setAccessKey(null);
        service.setSecretKey(null);
        AWSCredentialsProvider nullProvider = service.resolveCredentialsProvider();
        assertInstanceOf(DefaultAWSCredentialsProviderChain.class, nullProvider);

        // Test with one key missing
        service.setAccessKey("onlyKey");
        service.setSecretKey(null);
        assertInstanceOf(DefaultAWSCredentialsProviderChain.class, service.resolveCredentialsProvider());
    }

    // ---------------------------------------------------------------------------------------------
    // 2. Configuration Tests
    // ---------------------------------------------------------------------------------------------
    @Test
    @DisplayName("Configuration: Bucket, region, and endpoint settings are stored and configurable")
    void testConfiguration_Settings() {
        S3CloudStorageService service = new S3CloudStorageService();
        service.setBucketName("my-r2-bucket");
        service.setRegion("auto");
        service.setEndpoint("https://account-id.r2.cloudflarestorage.com");

        assertEquals("my-r2-bucket", service.getBucketName());
        assertEquals("auto", service.getRegion());
        assertEquals("https://account-id.r2.cloudflarestorage.com", service.getEndpoint());

        AmazonS3ClientBuilder builder = service.createClientBuilder();
        assertNotNull(builder);
    }

    // ---------------------------------------------------------------------------------------------
    // 3. Storage Operations (Upload, Download, Delete)
    // ---------------------------------------------------------------------------------------------
    @Test
    @DisplayName("storeFile: Successfully uploads file with metadata to S3")
    void testStoreFile_Success() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file", "ticket.pdf", "application/pdf", "%PDF-1.4 content".getBytes()
        );

        String result = s3CloudStorageService.storeFile(file, "uuid-ticket.pdf");

        assertEquals("uuid-ticket.pdf", result);
        ArgumentCaptor<ObjectMetadata> metadataCaptor = ArgumentCaptor.forClass(ObjectMetadata.class);
        verify(amazonS3).putObject(eq("test-bucket"), eq("uuid-ticket.pdf"), any(InputStream.class), metadataCaptor.capture());

        ObjectMetadata capturedMetadata = metadataCaptor.getValue();
        assertEquals("application/pdf", capturedMetadata.getContentType());
        assertEquals(file.getSize(), capturedMetadata.getContentLength());
    }

    @Test
    @DisplayName("loadFileAsResource: Successfully retrieves object as Resource")
    void testLoadFileAsResource_Success() throws IOException {
        S3Object s3Object = new S3Object();
        s3Object.setKey("uuid-doc.pdf");
        s3Object.setBucketName("test-bucket");

        byte[] content = "%PDF-1.4 test document".getBytes(StandardCharsets.UTF_8);
        S3ObjectInputStream stream = new S3ObjectInputStream(new ByteArrayInputStream(content), null);
        s3Object.setObjectContent(stream);

        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentLength(content.length);
        metadata.setContentType("application/pdf");
        s3Object.setObjectMetadata(metadata);

        when(amazonS3.getObject("test-bucket", "uuid-doc.pdf")).thenReturn(s3Object);

        Resource resource = s3CloudStorageService.loadFileAsResource("uuid-doc.pdf");

        assertNotNull(resource);
        assertEquals("uuid-doc.pdf", resource.getFilename());
        try (InputStream is = resource.getInputStream()) {
            assertArrayEquals(content, is.readAllBytes());
        }
    }

    @Test
    @DisplayName("deleteFile: Successfully delegates deletion to AmazonS3")
    void testDeleteFile_Success() throws IOException {
        s3CloudStorageService.deleteFile("uuid-delete.pdf");

        verify(amazonS3).deleteObject("test-bucket", "uuid-delete.pdf");
    }

    // ---------------------------------------------------------------------------------------------
    // 4. Path Traversal Rejection Tests
    // ---------------------------------------------------------------------------------------------
    @Test
    @DisplayName("Path traversal rejection: storeFile rejects ../, slashes, and null-bytes")
    void testStoreFile_PathTraversalRejection() {
        MockMultipartFile file = new MockMultipartFile("file", "doc.pdf", "application/pdf", "data".getBytes());

        assertThrows(SecurityException.class, () -> s3CloudStorageService.storeFile(file, "../evil.pdf"));
        assertThrows(SecurityException.class, () -> s3CloudStorageService.storeFile(file, "sub/dir/evil.pdf"));
        assertThrows(SecurityException.class, () -> s3CloudStorageService.storeFile(file, "sub\\dir\\evil.pdf"));
        assertThrows(SecurityException.class, () -> s3CloudStorageService.storeFile(file, "evil\0.pdf"));
        assertThrows(SecurityException.class, () -> s3CloudStorageService.storeFile(file, ""));
    }

    @Test
    @DisplayName("Path traversal rejection: loadFileAsResource rejects ../, slashes, and null-bytes")
    void testLoadFileAsResource_PathTraversalRejection() {
        assertThrows(SecurityException.class, () -> s3CloudStorageService.loadFileAsResource("../secret.pdf"));
        assertThrows(SecurityException.class, () -> s3CloudStorageService.loadFileAsResource("dir/secret.pdf"));
        assertThrows(SecurityException.class, () -> s3CloudStorageService.loadFileAsResource("dir\\secret.pdf"));
        assertThrows(SecurityException.class, () -> s3CloudStorageService.loadFileAsResource("secret\0.pdf"));
    }

    @Test
    @DisplayName("Path traversal rejection: deleteFile rejects ../, slashes, and null-bytes")
    void testDeleteFile_PathTraversalRejection() {
        assertThrows(SecurityException.class, () -> s3CloudStorageService.deleteFile("../delete.pdf"));
        assertThrows(SecurityException.class, () -> s3CloudStorageService.deleteFile("dir/delete.pdf"));
        assertThrows(SecurityException.class, () -> s3CloudStorageService.deleteFile("dir\\delete.pdf"));
        assertThrows(SecurityException.class, () -> s3CloudStorageService.deleteFile("delete\0.pdf"));
    }

    // ---------------------------------------------------------------------------------------------
    // 5. Error Behavior Tests
    // ---------------------------------------------------------------------------------------------
    @Test
    @DisplayName("Error handling: S3 upload failure wraps exception in IOException")
    void testStoreFile_S3Error_ThrowsIOException() {
        MockMultipartFile file = new MockMultipartFile("file", "doc.pdf", "application/pdf", "data".getBytes());

        doThrow(new AmazonClientException("S3 Service Unavailable"))
                .when(amazonS3).putObject(any(), any(), any(), any());

        IOException ex = assertThrows(IOException.class, () ->
                s3CloudStorageService.storeFile(file, "uuid-fail.pdf"));
        assertTrue(ex.getMessage().contains("Failed to upload file to S3-compatible cloud storage"));
    }

    @Test
    @DisplayName("Error handling: S3 404 on loadFileAsResource translates to FileNotFoundException")
    void testLoadFileAsResource_NotFound_ThrowsFileNotFoundException() {
        AmazonS3Exception s3404 = new AmazonS3Exception("The specified key does not exist.");
        s3404.setStatusCode(404);

        when(amazonS3.getObject("test-bucket", "missing.pdf")).thenThrow(s3404);

        assertThrows(FileNotFoundException.class, () ->
                s3CloudStorageService.loadFileAsResource("missing.pdf"));
    }

    @Test
    @DisplayName("Error handling: S3 general error on loadFileAsResource throws IOException")
    void testLoadFileAsResource_GeneralError_ThrowsIOException() {
        AmazonServiceException s3500 = new AmazonServiceException("Internal S3 Error");
        s3500.setStatusCode(500);

        when(amazonS3.getObject("test-bucket", "error.pdf")).thenThrow(s3500);

        assertThrows(IOException.class, () ->
                s3CloudStorageService.loadFileAsResource("error.pdf"));
    }

    @Test
    @DisplayName("Error handling: S3 delete failure wraps exception in IOException")
    void testDeleteFile_S3Error_ThrowsIOException() {
        doThrow(new AmazonServiceException("Access Denied"))
                .when(amazonS3).deleteObject("test-bucket", "uuid-del-fail.pdf");

        IOException ex = assertThrows(IOException.class, () ->
                s3CloudStorageService.deleteFile("uuid-del-fail.pdf"));
        assertTrue(ex.getMessage().contains("Failed to delete file from S3-compatible cloud storage"));
    }

    @Test
    @DisplayName("getStorageType: Returns S3_CLOUD")
    void testGetStorageType() {
        assertEquals("S3_CLOUD", s3CloudStorageService.getStorageType());
    }
}
