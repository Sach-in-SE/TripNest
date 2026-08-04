package com.tripnest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DestinationRequest {
    @NotBlank
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

    private Double estimatedBudget;

    private Integer recommendedDays;

    private Double latitude;

    private Double longitude;

    private Double rating;
}