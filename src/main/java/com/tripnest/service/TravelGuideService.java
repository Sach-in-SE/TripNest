package com.tripnest.service;

import com.tripnest.dto.TravelGuideResponse;
import com.tripnest.service.enrichment.TravelEnrichmentClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

@Service
public class TravelGuideService {

    private static final Logger logger = LoggerFactory.getLogger(TravelGuideService.class);
    private static final int MAX_CACHE_SIZE = 100;
    public static final String DEFAULT_ATTRIBUTION = "© OpenStreetMap contributors & Wikipedia";

    @Value("${tripnest.travel-guide.search-radius-km:10.0}")
    private double searchRadiusKm;

    @Value("${tripnest.travel-guide.cache-ttl-ms:3600000}")
    private long cacheTtlMs;

    @Value("${tripnest.travel-guide.max-results-per-category:6}")
    private int maxResultsPerCategory;

    @Autowired
    private TravelEnrichmentClient travelEnrichmentClient;

    public static class CacheEntry {
        TravelGuideResponse data;
        long timestamp;

        public CacheEntry(TravelGuideResponse data, long timestamp) {
            this.data = data;
            this.timestamp = timestamp;
        }
    }

    private final Map<String, CacheEntry> cache = Collections.synchronizedMap(
        new LinkedHashMap<String, CacheEntry>(MAX_CACHE_SIZE, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<String, CacheEntry> eldest) {
                return size() > MAX_CACHE_SIZE || (System.currentTimeMillis() - eldest.getValue().timestamp) >= cacheTtlMs;
            }
        }
    );

    public int getCacheSize() {
        return cache.size();
    }

    public void clearCache() {
        cache.clear();
    }

    public TravelGuideResponse getTravelGuide(String destinationName, String country, Double latitude, Double longitude) {
        if (latitude == null || longitude == null
                || latitude.isNaN() || longitude.isNaN()
                || latitude < -90.0 || latitude > 90.0
                || longitude < -180.0 || longitude > 180.0) {
            return TravelGuideResponse.builder()
                    .attractions(new ArrayList<>())
                    .hotels(new ArrayList<>())
                    .food(new ArrayList<>())
                    .shopping(new ArrayList<>())
                    .available(false)
                    .attribution(DEFAULT_ATTRIBUTION)
                    .build();
        }

        String cacheKey = String.format(Locale.US, "%.4f_%.4f_%.1f_%d", latitude, longitude, searchRadiusKm, maxResultsPerCategory);
        long now = System.currentTimeMillis();
        CacheEntry entry = cache.get(cacheKey);
        if (entry != null) {
            if ((now - entry.timestamp) < cacheTtlMs) {
                return entry.data;
            } else {
                cache.remove(cacheKey);
            }
        }

        try {
            TravelGuideResponse response = travelEnrichmentClient.enrich(
                    destinationName, country, latitude, longitude, searchRadiusKm, maxResultsPerCategory);

            if (response != null && response.isAvailable()) {
                cache.put(cacheKey, new CacheEntry(response, now));
                return response;
            }
        } catch (Exception e) {
            logger.warn("Failed to enrich travel guide for '{}' ({}, {}): {}", destinationName, latitude, longitude, e.getMessage());
        }

        return TravelGuideResponse.builder()
                .attractions(new ArrayList<>())
                .hotels(new ArrayList<>())
                .food(new ArrayList<>())
                .shopping(new ArrayList<>())
                .available(false)
                .attribution(DEFAULT_ATTRIBUTION)
                .build();
    }
}
