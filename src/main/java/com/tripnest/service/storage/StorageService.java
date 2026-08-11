package com.tripnest.service.storage;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

public interface StorageService {
    String storeFile(MultipartFile file, String storedFileName) throws IOException;
    Resource loadFileAsResource(String storedFileName) throws IOException;
    void deleteFile(String storedFileName) throws IOException;
    String getStorageType();
}
