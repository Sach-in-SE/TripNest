package com.tripnest.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.Set;

@Data
public class TravelPreferenceResponse {
    private Long id;
    private Set<String> preferredTripTypes;
    private String preferredBudgetRange;
    private String preferredTravelStyle;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
