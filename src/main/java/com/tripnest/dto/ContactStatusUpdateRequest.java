package com.tripnest.dto;

import com.tripnest.entity.ContactMessageStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ContactStatusUpdateRequest {

    @NotNull(message = "Message status is required")
    private ContactMessageStatus status;
}
