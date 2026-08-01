package com.tripnest.dto;

import lombok.Data;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Data
public class ActivityResponse {
    private Long id;
    private String title;
    private String description;
    private LocalTime startTime;
    private LocalTime endTime;
    private String location;
    private String type;
    private Double cost;
    private Long itineraryId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}