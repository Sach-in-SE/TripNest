package com.tripnest.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TripShareResponse {
    private Long id;
    private Long tripId;
    private String tripTitle;
    private Long sharedWithUserId;
    private String sharedWithUsername;
    private String sharedWithEmail;
    private Long sharedByUserId;
    private String sharedByUsername;
    private String permission;
    private LocalDateTime createdAt;
}