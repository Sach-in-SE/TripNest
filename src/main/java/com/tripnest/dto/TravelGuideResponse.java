package com.tripnest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TravelGuideResponse {
    @Builder.Default
    private List<TravelPlace> attractions = new ArrayList<>();

    @Builder.Default
    private List<TravelPlace> hotels = new ArrayList<>();

    @Builder.Default
    private List<TravelPlace> food = new ArrayList<>();

    @Builder.Default
    private List<TravelPlace> shopping = new ArrayList<>();

    private boolean available;
    private String attribution;
}
