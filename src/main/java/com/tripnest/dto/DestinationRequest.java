package com.tripnest.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DestinationRequest {
    @NotBlank(message = "Destination name is required")
    @Size(max = 100)
    private String name;

    @Size(max = 100)
    private String state;

    @Size(max = 100)
    private String country;

    private String description;

    @Size(max = 100)
    private String category;

    @Size(max = 500)
    private String imageUrl;

    @Size(max = 100)
    private String bestSeason;

    @Min(value = 0, message = "Estimated budget cannot be negative")
    private Double estimatedBudget;

    @Min(value = 1, message = "Recommended days must be at least 1")
    private Integer recommendedDays;

    @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90")
    @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90")
    private Double latitude;

    @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180")
    @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180")
    private Double longitude;

    @DecimalMin(value = "0.0", message = "Rating must be between 0.0 and 5.0")
    @DecimalMax(value = "5.0", message = "Rating must be between 0.0 and 5.0")
    private Double rating;
}