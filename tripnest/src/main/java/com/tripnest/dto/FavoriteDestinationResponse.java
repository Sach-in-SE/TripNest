package com.tripnest.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class FavoriteDestinationResponse {
    private Long id;
    private Long destinationId;
    private String destinationName;
    private String country;
    private String city;
    private String description;
    private String imageUrl;
    private String climate;
    private String bestTimeToVisit;
    private Double averageCost;
    private boolean popular;
    private LocalDateTime createdAt;
}
