package com.tripnest.dto;

import lombok.Data;

@Data
public class DestinationResponse {
    private Long id;
    private String name;
    private String state;
    private String country;
    private String description;
    private String category;
    private String imageUrl;
    private String bestSeason;
    private Double estimatedBudget;
    private Integer recommendedDays;
    private Double latitude;
    private Double longitude;
    private Double rating;
    private Double distanceKm;
    private Boolean popular;
}