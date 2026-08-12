package com.tripnest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DestinationDetailsResponse {
    private DestinationResponse destination;
    private WeatherResponse weather;
    private List<DestinationResponse> nearbyDestinations;
    private WikipediaResponse wikipedia;
}
