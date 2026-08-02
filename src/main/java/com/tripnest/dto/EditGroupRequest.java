package com.tripnest.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;

@Data
public class EditGroupRequest {
    @NotBlank(message = "Group name is required")
    private String name;
    private String description;
}