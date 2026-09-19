package com.tripnest.service.storage;

import com.amazonaws.auth.AWSCredentialsProvider;
import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.auth.DefaultAWSCredentialsProviderChain;
import com.amazonaws.client.builder.AwsClientBuilder;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.amazonaws.services.s3.model.AmazonS3Exception;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.S3Object;
import com.amazonaws.services.s3.model.S3ObjectInputStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.FileNotFoundException;
import java.io.IOException;

@Service("s3CloudStorageService")
public class S3CloudStorageService implements StorageService {

    private static final Logger logger = LoggerFactory.getLogger(S3CloudStorageService.class);

    @Value("${tripnest.storage.s3.bucket:tripnest-documents}")
    private String bucketName = "tripnest-documents";

    @Value("${tripnest.storage.s3.region:us-east-1}")
    private String region = "us-east-1";

    @Value("${tripnest.storage.s3.access-key:}")
    private String accessKey;

    @Value("${tripnest.storage.s3.secret-key:}")
    private String secretKey;

    @Value("${tripnest.storage.s3.endpoint:}")
    private String endpoint;

    private AmazonS3 s3Client;

    // Package-private setters for unit testing
    void setS3Client(AmazonS3 s3Client) {
        this.s3Client = s3Client;
    }

    void setBucketName(String bucketName) {
        this.bucketName = bucketName;
    }

    void setRegion(String region) {
        this.region = region;
    }

    void setAccessKey(String accessKey) {
        this.accessKey = accessKey;
    }

    void setSecretKey(String secretKey) {
        this.secretKey = secretKey;
    }

    void setEndpoint(String endpoint) {
        this.endpoint = endpoint;
    }

    String getBucketName() {
        return bucketName;
    }

    String getRegion() {
        return region;
    }

    String getEndpoint() {
        return endpoint;
    }

    AWSCredentialsProvider resolveCredentialsProvider() {
        if (accessKey != null && !accessKey.trim().isEmpty() && secretKey != null && !secretKey.trim().isEmpty()) {
            return new AWSStaticCredentialsProvider(new BasicAWSCredentials(accessKey.trim(), secretKey.trim()));
        }
        return DefaultAWSCredentialsProviderChain.getInstance();
    }

    AmazonS3ClientBuilder createClientBuilder() {
        AWSCredentialsProvider credentialsProvider = resolveCredentialsProvider();
        AmazonS3ClientBuilder builder = AmazonS3ClientBuilder.standard()
                .withCredentials(credentialsProvider);

        if (endpoint != null && !endpoint.trim().isEmpty()) {
            builder.withEndpointConfiguration(new AwsClientBuilder.EndpointConfiguration(endpoint.trim(), region));
        } else {
            builder.withRegion(region);
        }
        return builder;
    }

    private synchronized AmazonS3 getS3Client() {
        if (s3Client == null) {
            s3Client = createClientBuilder().build();
        }
        return s3Client;
    }

    private void validateFileName(String storedFileName) {
        if (storedFileName == null || storedFileName.isBlank()
                || storedFileName.contains("..")
                || storedFileName.contains("/")
                || storedFileName.contains("\\")
                || storedFileName.contains("\0")) {
            throw new SecurityException("Illegal filename path traversal detected.");
        }
    }

    @Override
    public String storeFile(MultipartFile file, String storedFileName) throws IOException {
        validateFileName(storedFileName);
        try {
            AmazonS3 client = getS3Client();
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentLength(file.getSize());
            if (file.getContentType() != null && !file.getContentType().trim().isEmpty()) {
                metadata.setContentType(file.getContentType().trim());
            }

            client.putObject(bucketName, storedFileName, file.getInputStream(), metadata);
            return storedFileName;
        } catch (SecurityException se) {
            throw se;
        } catch (Exception e) {
            logger.error("Failed to upload file to S3-compatible cloud storage: {}", e.getMessage());
            throw new IOException("Failed to upload file to S3-compatible cloud storage: " + e.getMessage(), e);
        }
    }

    @Override
    public Resource loadFileAsResource(String storedFileName) throws IOException {
        validateFileName(storedFileName);
        try {
            AmazonS3 client = getS3Client();
            S3Object s3Object = client.getObject(bucketName, storedFileName);
            if (s3Object == null) {
                throw new FileNotFoundException("File not found in S3 storage: " + storedFileName);
            }
            S3ObjectInputStream inputStream = s3Object.getObjectContent();
            return new InputStreamResource(inputStream) {
                @Override
                public String getFilename() {
                    return storedFileName;
                }

                @Override
                public long contentLength() {
                    return s3Object.getObjectMetadata() != null ? s3Object.getObjectMetadata().getContentLength() : -1;
                }
            };
        } catch (SecurityException se) {
            throw se;
        } catch (FileNotFoundException fe) {
            throw fe;
        } catch (AmazonS3Exception s3e) {
            if (s3e.getStatusCode() == 404) {
                throw new FileNotFoundException("File not found in S3 storage: " + storedFileName);
            }
            logger.error("S3-compatible cloud storage error: {}", s3e.getMessage());
            throw new IOException("Failed to load file from S3-compatible cloud storage: " + s3e.getMessage(), s3e);
        } catch (Exception e) {
            logger.error("Failed to load file from S3-compatible cloud storage: {}", e.getMessage());
            throw new IOException("Failed to load file from S3-compatible cloud storage: " + e.getMessage(), e);
        }
    }

    @Override
    public void deleteFile(String storedFileName) throws IOException {
        validateFileName(storedFileName);
        try {
            AmazonS3 client = getS3Client();
            client.deleteObject(bucketName, storedFileName);
        } catch (SecurityException se) {
            throw se;
        } catch (Exception e) {
            logger.error("Failed to delete file from S3-compatible cloud storage: {}", e.getMessage());
            throw new IOException("Failed to delete file from S3-compatible cloud storage: " + e.getMessage(), e);
        }
    }

    @Override
    public String getStorageType() {
        return "S3_CLOUD";
    }
}
