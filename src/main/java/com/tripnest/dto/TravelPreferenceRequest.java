package com.tripnest.dto;

import lombok.Data;
import java.util.Set;

@Data
public class TravelPreferenceRequest {
    private Set<String> preferredTripTypes;
    private String preferredBudgetRange;
    private String preferredTravelStyle;
}
