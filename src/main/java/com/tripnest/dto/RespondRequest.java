package com.tripnest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class RespondRequest {

    @NotBlank(message = "Action is required")
    @Pattern(regexp = "^(?i)(ACCEPT|DECLINE)$", message = "Action must be ACCEPT or DECLINE")
    private String action; // "ACCEPT" or "DECLINE"
}
