package com.tripnest.dto;

import lombok.Data;

@Data
public class DestinationResponse {
    private Long id;
    private String name;
    private String country;
    private String city;
    private String description;
    private String imageUrl;
    private String climate;
    private String bestTimeToVisit;
    private Double averageCost;
    private boolean popular;
}