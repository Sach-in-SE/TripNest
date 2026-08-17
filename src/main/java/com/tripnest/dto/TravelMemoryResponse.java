package com.tripnest.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TravelMemoryResponse {
    private Long id;
    private String title;
    private String caption;
    private String locationName;
    private String imageUrl;
    private String storedFileName;
    private String visibility;
    private Long tripId;
    private String tripTitle;
    private Long destinationId;
    private String destinationName;
    private Long userId;
    private String userName;
    private String userAvatarInitial;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean isOwner;
}
