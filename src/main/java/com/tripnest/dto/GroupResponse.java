package com.tripnest.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class GroupResponse {
    private Long id;
    private String name;
    private String description;
    private Long tripId;
    private String tripTitle;
    private Long createdById;
    private String createdByUsername;
    private List<String> memberUsernames;
    private int memberCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}