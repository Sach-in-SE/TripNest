package com.tripnest.service.enrichment;

import com.tripnest.dto.TravelGuideResponse;

public interface TravelEnrichmentClient {

    /**
     * Enrich a destination with real points of interest (attractions, hotels, food, shopping)
     * using geographic coordinates and a search radius.
     *
     * @param destinationName Destination name
     * @param country         Country name
     * @param latitude        Search center latitude
     * @param longitude       Search center longitude
     * @param radiusKm        Search radius in kilometers
     * @param limitPerCategory Maximum POIs to return per category
     * @return TravelGuideResponse containing categorized real POIs
     */
    TravelGuideResponse enrich(String destinationName, String country, Double latitude, Double longitude, double radiusKm, int limitPerCategory);
}
