package com.tripnest.service.storage;

import com.azure.core.util.BinaryData;
import com.azure.core.util.Context;
import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobServiceClient;
import com.azure.storage.blob.BlobServiceClientBuilder;
import com.azure.storage.blob.models.BlobHttpHeaders;
import com.azure.storage.blob.models.BlobStorageException;
import com.azure.storage.blob.options.BlobParallelUploadOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.FileNotFoundException;
import java.io.IOException;

@Service("azureBlobStorageService")
public class AzureBlobStorageService implements StorageService {

    private static final Logger logger = LoggerFactory.getLogger(AzureBlobStorageService.class);

    @Value("${tripnest.storage.azure.connection-string:}")
    private String connectionString;

    @Value("${tripnest.storage.azure.container-name:tripnest-media}")
    private String containerName;

    @Value("${tripnest.storage.azure.endpoint:}")
    private String endpoint;

    private BlobContainerClient blobContainerClient;

    // Package-private setter for testing with mocks
    void setBlobContainerClient(BlobContainerClient blobContainerClient) {
        this.blobContainerClient = blobContainerClient;
    }

    private synchronized BlobContainerClient getBlobContainerClient() {
        if (blobContainerClient == null) {
            BlobServiceClient blobServiceClient;
            if (connectionString != null && !connectionString.trim().isEmpty()) {
                blobServiceClient = new BlobServiceClientBuilder()
                        .connectionString(connectionString.trim())
                        .buildClient();
            } else if (endpoint != null && !endpoint.trim().isEmpty()) {
                blobServiceClient = new BlobServiceClientBuilder()
                        .endpoint(endpoint.trim())
                        .buildClient();
            } else {
                throw new IllegalStateException("Azure Blob Storage connection string or endpoint is not configured. " +
                        "Please set STORAGE_AZURE_CONNECTION_STRING in your environment.");
            }

            this.blobContainerClient = blobServiceClient.getBlobContainerClient(containerName);
            try {
                if (!this.blobContainerClient.exists()) {
                    this.blobContainerClient.create();
                    logger.info("Created Azure Blob Storage container: {}", containerName);
                }
            } catch (Exception e) {
                logger.warn("Could not check/create Azure Blob Storage container '{}': {}", containerName, e.getMessage());
            }
        }
        return blobContainerClient;
    }

    @Override
    public String storeFile(MultipartFile file, String storedFileName) throws IOException {
        if (storedFileName == null || storedFileName.contains("..") || storedFileName.contains("/") || storedFileName.contains("\\")) {
            throw new SecurityException("Illegal filename path traversal detected.");
        }

        try {
            BlobClient blobClient = getBlobContainerClient().getBlobClient(storedFileName);
            BlobHttpHeaders headers = new BlobHttpHeaders();
            if (file.getContentType() != null && !file.getContentType().trim().isEmpty()) {
                headers.setContentType(file.getContentType().trim());
            }

            BlobParallelUploadOptions options = new BlobParallelUploadOptions(file.getInputStream(), file.getSize())
                    .setHeaders(headers);
            blobClient.uploadWithResponse(options, null, Context.NONE);
            return storedFileName;
        } catch (SecurityException se) {
            throw se;
        } catch (Exception e) {
            logger.error("Failed to upload file to Azure Blob Storage: {}", e.getMessage());
            throw new IOException("Failed to upload file to Azure Blob Storage: " + e.getMessage(), e);
        }
    }

    @Override
    public Resource loadFileAsResource(String storedFileName) throws IOException {
        if (storedFileName == null || storedFileName.contains("..") || storedFileName.contains("/") || storedFileName.contains("\\")) {
            throw new SecurityException("Illegal filename path traversal detected.");
        }

        try {
            BlobClient blobClient = getBlobContainerClient().getBlobClient(storedFileName);
            if (!blobClient.exists()) {
                throw new FileNotFoundException("Blob not found in Azure Blob Storage: " + storedFileName);
            }

            BinaryData binaryData = blobClient.downloadContent();
            return new ByteArrayResource(binaryData.toBytes()) {
                @Override
                public String getFilename() {
                    return storedFileName;
                }
            };
        } catch (SecurityException se) {
            throw se;
        } catch (FileNotFoundException fe) {
            throw fe;
        } catch (BlobStorageException bse) {
            if (bse.getStatusCode() == 404) {
                throw new FileNotFoundException("Blob not found in Azure Blob Storage: " + storedFileName);
            }
            logger.error("Azure Blob Storage error: {}", bse.getMessage());
            throw new IOException("Azure Blob Storage error: " + bse.getMessage(), bse);
        } catch (Exception e) {
            logger.error("Failed to load file from Azure Blob Storage: {}", e.getMessage());
            throw new IOException("Failed to load file from Azure Blob Storage: " + e.getMessage(), e);
        }
    }

    @Override
    public void deleteFile(String storedFileName) throws IOException {
        if (storedFileName == null || storedFileName.contains("..") || storedFileName.contains("/") || storedFileName.contains("\\")) {
            throw new SecurityException("Illegal filename path traversal detected.");
        }

        try {
            BlobClient blobClient = getBlobContainerClient().getBlobClient(storedFileName);
            blobClient.deleteIfExists();
        } catch (SecurityException se) {
            throw se;
        } catch (Exception e) {
            logger.error("Failed to delete file from Azure Blob Storage: {}", e.getMessage());
            throw new IOException("Failed to delete file from Azure Blob Storage: " + e.getMessage(), e);
        }
    }

    @Override
    public String getStorageType() {
        return "AZURE_BLOB";
    }
}
