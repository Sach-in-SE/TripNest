package com.tripnest.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class NotificationResponse {
    private Long id;
    private String title;
    private String message;
    private String type;
    private boolean isRead;
    private Long userId;
    private Long referenceId;
    private LocalDateTime createdAt;
}