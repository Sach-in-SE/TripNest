package com.tripnest.dto;

import lombok.Data;
import java.util.List;

@Data
public class TravelHistoryResponse {
    private int totalCompletedTrips;
    private Double totalAmountSpent;
    private List<String> destinationsVisited;
    private List<TripResponse> completedTrips;
}
