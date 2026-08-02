package com.tripnest.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

@Data
public class GroupRequest {
    @NotBlank(message = "Group name is required")
    private String name;
    private String description;
    private Long tripId;
    private List<Long> memberIds;
}