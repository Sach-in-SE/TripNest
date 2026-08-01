package com.tripnest.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class DocumentResponse {
    private Long id;
    private String fileName;
    private String fileType;
    private String fileUrl;
    private String documentType;
    private Long tripId;
    private String tripTitle;
    private Long userId;
    private String username;
    private LocalDateTime createdAt;
}