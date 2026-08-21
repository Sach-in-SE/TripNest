package com.tripnest.dto;

import com.tripnest.entity.ContactCategory;
import com.tripnest.entity.ContactMessage;
import com.tripnest.entity.ContactMessageStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ContactMessageResponse {

    private Long id;
    private String name;
    private String email;
    private ContactCategory category;
    private String categoryDisplayName;
    private String subject;
    private String message;
    private ContactMessageStatus status;
    private String statusDisplayName;
    private Long userId;
    private String username;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ContactMessageResponse fromEntity(ContactMessage entity) {
        if (entity == null) return null;

        ContactMessageResponse response = new ContactMessageResponse();
        response.setId(entity.getId());
        response.setName(entity.getName());
        response.setEmail(entity.getEmail());
        response.setCategory(entity.getCategory());
        response.setCategoryDisplayName(entity.getCategory() != null ? entity.getCategory().getDisplayName() : null);
        response.setSubject(entity.getSubject());
        response.setMessage(entity.getMessage());
        response.setStatus(entity.getStatus());
        response.setStatusDisplayName(entity.getStatus() != null ? entity.getStatus().getDisplayName() : null);

        if (entity.getUser() != null) {
            response.setUserId(entity.getUser().getId());
            response.setUsername(entity.getUser().getUsername());
        }

        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());
        return response;
    }
}
