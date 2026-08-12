package com.tripnest.service.storage;

import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.client.builder.AwsClientBuilder;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.S3Object;
import com.amazonaws.services.s3.model.S3ObjectInputStream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service("s3CloudStorageService")
public class S3CloudStorageService implements StorageService {

    @Value("${tripnest.storage.s3.bucket:tripnest-documents}")
    private String bucketName;

    @Value("${tripnest.storage.s3.region:us-east-1}")
    private String region;

    @Value("${tripnest.storage.s3.access-key:}")
    private String accessKey;

    @Value("${tripnest.storage.s3.secret-key:}")
    private String secretKey;

    @Value("${tripnest.storage.s3.endpoint:}")
    private String endpoint;

    private AmazonS3 s3Client;

    private synchronized AmazonS3 getS3Client() {
        if (s3Client == null) {
            BasicAWSCredentials credentials = new BasicAWSCredentials(accessKey, secretKey);
            AmazonS3ClientBuilder builder = AmazonS3ClientBuilder.standard()
                    .withCredentials(new AWSStaticCredentialsProvider(credentials));

            if (endpoint != null && !endpoint.trim().isEmpty()) {
                builder.withEndpointConfiguration(new AwsClientBuilder.EndpointConfiguration(endpoint, region));
            } else {
                builder.withRegion(region);
            }
            s3Client = builder.build();
        }
        return s3Client;
    }

    @Override
    public String storeFile(MultipartFile file, String storedFileName) throws IOException {
        try {
            AmazonS3 client = getS3Client();
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentLength(file.getSize());
            if (file.getContentType() != null) {
                metadata.setContentType(file.getContentType());
            }

            client.putObject(bucketName, storedFileName, file.getInputStream(), metadata);
            return storedFileName;
        } catch (Exception e) {
            throw new IOException("Failed to upload file to S3-compatible cloud storage: " + e.getMessage(), e);
        }
    }

    @Override
    public Resource loadFileAsResource(String storedFileName) throws IOException {
        try {
            AmazonS3 client = getS3Client();
            S3Object s3Object = client.getObject(bucketName, storedFileName);
            S3ObjectInputStream inputStream = s3Object.getObjectContent();
            return new InputStreamResource(inputStream);
        } catch (Exception e) {
            throw new IOException("Failed to load file from S3-compatible cloud storage: " + e.getMessage(), e);
        }
    }

    @Override
    public void deleteFile(String storedFileName) throws IOException {
        try {
            AmazonS3 client = getS3Client();
            client.deleteObject(bucketName, storedFileName);
        } catch (Exception e) {
            throw new IOException("Failed to delete file from S3-compatible cloud storage: " + e.getMessage(), e);
        }
    }

    @Override
    public String getStorageType() {
        return "S3_CLOUD";
    }
}
