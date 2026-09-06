package com.tripnest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemoryImageResponse {
    private Long id;
    private String imageUrl;
    private String fileUrl;
    private String storedFileName;
    private String originalFileName;
    private String contentType;
    private Long fileSize;
    private int displayOrder;

    public String getImageUrl() {
        return imageUrl != null ? imageUrl : fileUrl;
    }

    public String getFileUrl() {
        return fileUrl != null ? fileUrl : imageUrl;
    }
}
