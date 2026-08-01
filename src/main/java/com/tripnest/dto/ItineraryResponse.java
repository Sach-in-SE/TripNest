package com.tripnest.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ItineraryResponse {
    private Long id;
    private LocalDate date;
    private String notes;
    private Long tripId;
    private String tripTitle;
    private List<ActivityResponse> activities;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}