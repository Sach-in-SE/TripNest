package com.tripnest.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class TravelMemoryResponse {
    private Long id;
    private String title;
    private String caption;
    private String locationName;
    private String imageUrl;
    private String storedFileName;
    private List<MemoryImageResponse> images;
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
    private Boolean isPublic;

    public Boolean getIsPublic() {
        if (isPublic != null) {
            return isPublic;
        }
        return "PUBLIC".equalsIgnoreCase(visibility);
    }

    public String getAuthorName() {
        return userName;
    }

    public void setAuthorName(String authorName) {
        if (this.userName == null || this.userName.isEmpty()) {
            this.userName = authorName;
        }
    }
}
