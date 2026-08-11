package com.tripnest.service.storage;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
@Primary
public class DelegatingStorageService implements StorageService {

    @Value("${tripnest.storage.type:local}")
    private String storageType;

    @Value("${tripnest.storage.s3.access-key:}")
    private String s3AccessKey;

    @Autowired
    @Qualifier("localStorageService")
    private StorageService localStorageService;

    @Autowired
    @Qualifier("s3CloudStorageService")
    private StorageService s3CloudStorageService;

    private StorageService getActiveStorageService() {
        if ("s3".equalsIgnoreCase(storageType) || (s3AccessKey != null && !s3AccessKey.trim().isEmpty())) {
            return s3CloudStorageService;
        }
        return localStorageService;
    }

    @Override
    public String storeFile(MultipartFile file, String storedFileName) throws IOException {
        return getActiveStorageService().storeFile(file, storedFileName);
    }

    @Override
    public Resource loadFileAsResource(String storedFileName) throws IOException {
        return getActiveStorageService().loadFileAsResource(storedFileName);
    }

    @Override
    public void deleteFile(String storedFileName) throws IOException {
        getActiveStorageService().deleteFile(storedFileName);
    }

    @Override
    public String getStorageType() {
        return getActiveStorageService().getStorageType();
    }
}
