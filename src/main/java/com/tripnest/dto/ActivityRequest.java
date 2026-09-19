package com.tripnest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.time.LocalTime;

@Data
public class ActivityRequest {

    @NotBlank(message = "Activity title is required")
    @Size(max = 100, message = "Title cannot exceed 100 characters")
    private String title;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    private LocalTime startTime;
    private LocalTime endTime;

    @Size(max = 200, message = "Location cannot exceed 200 characters")
    private String location;

    private String type;

    @PositiveOrZero(message = "Cost must be zero or positive")
    private Double cost;

    @NotNull(message = "Itinerary ID is required")
    private Long itineraryId;

    private String reminder; // NONE, THIRTY_MINUTES, ONE_HOUR, TWO_HOURS, ONE_DAY
}