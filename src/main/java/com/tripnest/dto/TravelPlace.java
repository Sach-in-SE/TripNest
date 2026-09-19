package com.tripnest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TravelPlace {
    private String title;
    private String snippet;
    private String category; // ATTRACTION, HOTEL, FOOD, SHOPPING
    private String imageUrl;
    private String pageUrl;
    private Double distanceKm;
    private Double latitude;
    private Double longitude;
    private String address;
    private String phone;
    private String website;
}
