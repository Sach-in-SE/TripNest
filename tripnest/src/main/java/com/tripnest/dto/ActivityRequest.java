package com.tripnest.dto;

import lombok.Data;
import java.time.LocalTime;

@Data
public class ActivityRequest {
    private String title;
    private String description;
    private LocalTime startTime;
    private LocalTime endTime;
    private String location;
    private String type;
    private Double cost;
    private Long itineraryId;
}