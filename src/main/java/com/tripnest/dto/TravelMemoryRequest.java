package com.tripnest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TravelMemoryRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 150, message = "Title must not exceed 150 characters")
    private String title;

    @Size(max = 2000, message = "Caption must not exceed 2000 characters")
    private String caption;

    @Size(max = 200, message = "Location must not exceed 200 characters")
    private String locationName;

    private Long tripId;

    private Long destinationId;

    private String visibility = "PRIVATE";
}
