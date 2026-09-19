package com.tripnest.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.time.LocalDate;

@Data
public class ItineraryRequest {

    @NotNull(message = "Itinerary date is required")
    private LocalDate date;

    @Size(max = 1000, message = "Notes cannot exceed 1000 characters")
    private String notes;

    @NotNull(message = "Trip ID is required")
    private Long tripId;
}