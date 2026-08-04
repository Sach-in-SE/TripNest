package com.tripnest.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class FavoriteDestinationResponse {
    private Long id;
    private Long destinationId;
    private String destinationName;
    private String country;
    private String state;
    private String description;
    private String imageUrl;
    private String category;
    private String bestSeason;
    private Double estimatedBudget;
    private Integer recommendedDays;
    private Double rating;
    private LocalDateTime createdAt;
}
