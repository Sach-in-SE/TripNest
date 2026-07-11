package com.tripnest.dto;

import lombok.Data;
import java.util.List;

@Data
public class GroupRequest {
    private String name;
    private String description;
    private Long tripId;
    private List<Long> memberIds;
}