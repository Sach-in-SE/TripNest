package com.tripnest.service;

import com.tripnest.dto.DestinationDetailsResponse;
import com.tripnest.dto.DestinationResponse;
import com.tripnest.entity.Destination;
import com.tripnest.repository.DestinationRepository;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

@SpringBootTest(classes = com.tripnest.tripnest.TripnestApplication.class)
class DestinationRuntimeBenchmarkTest {

    private static final Logger logger = LoggerFactory.getLogger(DestinationRuntimeBenchmarkTest.class);

    @Autowired
    private DestinationService destinationService;

    @Autowired
    private DestinationRepository destinationRepository;

    @Autowired
    private WeatherService weatherService;

    @Autowired
    private WikipediaService wikipediaService;

    @Autowired
    private TravelGuideService travelGuideService;

    @Test
    void measureDestinationPerformance() {
        System.out.println("========== DESTINATION PERFORMANCE MEASUREMENT ==========");

        // 1. Measure List
        long listStart1 = System.currentTimeMillis();
        List<DestinationResponse> list1 = destinationService.getAllDestinations();
        long listTime1 = System.currentTimeMillis() - listStart1;
        System.out.println("[BENCHMARK] getAllDestinations() Call 1: " + listTime1 + " ms, count: " + list1.size());

        long listStart2 = System.currentTimeMillis();
        List<DestinationResponse> list2 = destinationService.getAllDestinations();
        long listTime2 = System.currentTimeMillis() - listStart2;
        System.out.println("[BENCHMARK] getAllDestinations() Call 2: " + listTime2 + " ms, count: " + list2.size());

        if (list1.isEmpty()) {
            System.out.println("[BENCHMARK] No destinations found, skipping details");
            return;
        }

        Destination first = destinationRepository.findAll().get(0);
        Long id = first.getId();
        System.out.println("[BENCHMARK] Testing Destination ID: " + id + " (" + first.getName() + ", " + first.getCountry() + ")");

        // Measure individual components
        long dbStart = System.currentTimeMillis();
        destinationRepository.findById(id);
        long dbTime = System.currentTimeMillis() - dbStart;
        System.out.println("[BENCHMARK] Component DB findById: " + dbTime + " ms");

        long weatherStart = System.currentTimeMillis();
        try {
            weatherService.getCurrentWeather(first.getLatitude(), first.getLongitude());
        } catch (Exception e) {
            System.out.println("[BENCHMARK] Weather error: " + e.getMessage());
        }
        long weatherTime = System.currentTimeMillis() - weatherStart;
        System.out.println("[BENCHMARK] Component WeatherService: " + weatherTime + " ms");

        long wikiStart = System.currentTimeMillis();
        try {
            wikipediaService.getWikipediaSummary(first.getName());
        } catch (Exception e) {
            System.out.println("[BENCHMARK] Wikipedia error: " + e.getMessage());
        }
        long wikiTime = System.currentTimeMillis() - wikiStart;
        System.out.println("[BENCHMARK] Component WikipediaService: " + wikiTime + " ms");

        long guideStart = System.currentTimeMillis();
        try {
            travelGuideService.getTravelGuide(first.getName(), first.getCountry(), first.getLatitude(), first.getLongitude());
        } catch (Exception e) {
            System.out.println("[BENCHMARK] TravelGuide error: " + e.getMessage());
        }
        long guideTime = System.currentTimeMillis() - guideStart;
        System.out.println("[BENCHMARK] Component TravelGuideService: " + guideTime + " ms");

        // Measure full getDestinationDetails on a completely fresh destination ID: 3
        Destination freshDest = destinationRepository.findAll().get(2);
        Long id3 = freshDest.getId();
        System.out.println("[BENCHMARK] Testing Fast DB getDestinationById on ID: " + id3 + " (" + freshDest.getName() + ")");
        long rawStart = System.currentTimeMillis();
        DestinationResponse rawDest = destinationService.getDestinationById(id3);
        long rawTime = System.currentTimeMillis() - rawStart;
        System.out.println("[BENCHMARK] getDestinationById() Fast DB: " + rawTime + " ms");

        System.out.println("[BENCHMARK] Testing Full getDestinationDetails on ID: " + id3 + " (" + freshDest.getName() + ")");
        long detailStart1 = System.currentTimeMillis();
        DestinationDetailsResponse details1 = destinationService.getDestinationDetails(id3);
        long detailTime1 = System.currentTimeMillis() - detailStart1;
        System.out.println("[BENCHMARK] getDestinationDetails() Call 1 (cache miss): " + detailTime1 + " ms");

        long detailStart2 = System.currentTimeMillis();
        DestinationDetailsResponse details2 = destinationService.getDestinationDetails(id3);
        long detailTime2 = System.currentTimeMillis() - detailStart2;
        // Enforce performance regression assertions
        org.junit.jupiter.api.Assertions.assertTrue(listTime2 < 50, "Cached destinations list must return in <50ms");
        org.junit.jupiter.api.Assertions.assertTrue(rawTime < 100, "Fast DB getDestinationById must return in <100ms");
        org.junit.jupiter.api.Assertions.assertTrue(detailTime1 < 1000, "Destination details cache miss must return in <1000ms and not block on external APIs");
        org.junit.jupiter.api.Assertions.assertTrue(detailTime2 < 50, "Destination details cache hit must return in <50ms");
        System.out.println("=========================================================");
    }
}
