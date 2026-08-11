package com.tripnest.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AdminUserStatusRequest {

    @NotNull(message = "Enabled status must not be null")
    private Boolean enabled;
}
