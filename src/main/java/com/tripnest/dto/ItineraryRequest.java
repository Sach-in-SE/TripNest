package com.tripnest.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class ItineraryRequest {
    private LocalDate date;
    private String notes;
    private Long tripId;
}