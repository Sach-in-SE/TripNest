package com.tripnest.service.enrichment;

import com.tripnest.dto.TravelGuideResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OsmOverpassEnrichmentClientTest {

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private OsmOverpassEnrichmentClient enrichmentClient;

    @Test
    @DisplayName("Enrichment with Real OSM Data - Successfully parses and categorizes POIs")
    void testEnrich_Success() {
        Map<String, Object> hotelNode = new HashMap<>();
        hotelNode.put("id", 101L);
        hotelNode.put("lat", 26.9283);
        hotelNode.put("lon", 75.7922);
        Map<String, String> hotelTags = new HashMap<>();
        hotelTags.put("name", "Umaid Bhawan Hotel");
        hotelTags.put("tourism", "hotel");
        hotelTags.put("stars", "4");
        hotelTags.put("website", "https://www.umaidbhawan.com");
        hotelNode.put("tags", hotelTags);

        Map<String, Object> foodNode = new HashMap<>();
        foodNode.put("id", 102L);
        foodNode.put("lat", 26.9161);
        foodNode.put("lon", 75.8109);
        Map<String, String> foodTags = new HashMap<>();
        foodTags.put("name", "Natraj Restaurant");
        foodTags.put("amenity", "restaurant");
        foodTags.put("cuisine", "indian");
        foodNode.put("tags", foodTags);

        Map<String, Object> shopNode = new HashMap<>();
        shopNode.put("id", 103L);
        shopNode.put("lat", 26.9190);
        shopNode.put("lon", 75.8200);
        Map<String, String> shopTags = new HashMap<>();
        shopTags.put("name", "Bapu Bazaar");
        shopTags.put("shop", "mall");
        shopNode.put("tags", shopTags);

        Map<String, Object> overpassBody = new HashMap<>();
        overpassBody.put("elements", List.of(hotelNode, foodNode, shopNode));

        ResponseEntity<Map> mockEntity = new ResponseEntity<>(overpassBody, HttpStatus.OK);
        when(restTemplate.exchange(any(java.net.URI.class), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(mockEntity);

        TravelGuideResponse res = enrichmentClient.enrich("Jaipur", "India", 26.9124, 75.7873, 10.0, 6);

        assertNotNull(res);
        assertTrue(res.isAvailable());
        assertEquals(1, res.getHotels().size());
        assertEquals("Umaid Bhawan Hotel", res.getHotels().get(0).getTitle());
        assertEquals("HOTEL", res.getHotels().get(0).getCategory());
        assertEquals("https://www.umaidbhawan.com", res.getHotels().get(0).getPageUrl());
        assertNotNull(res.getHotels().get(0).getDistanceKm());

        assertEquals(1, res.getFood().size());
        assertEquals("Natraj Restaurant", res.getFood().get(0).getTitle());
        assertEquals("FOOD", res.getFood().get(0).getCategory());

        assertEquals(1, res.getShopping().size());
        assertEquals("Bapu Bazaar", res.getShopping().get(0).getTitle());
        assertEquals("SHOPPING", res.getShopping().get(0).getCategory());
    }

    @Test
    @DisplayName("Null Coordinates - Returns empty unavailable response")
    void testEnrich_NullCoordinates() {
        TravelGuideResponse res = enrichmentClient.enrich("Jaipur", "India", null, null, 10.0, 6);
        assertNotNull(res);
        assertFalse(res.isAvailable());
        assertTrue(res.getAttractions().isEmpty());
    }

    @Test
    @DisplayName("Deduplication & Proximity - Filters duplicates and ranks closer/richer POIs first")
    void testEnrich_DeduplicationAndDistanceFiltering() {
        // First instance with less info but close
        Map<String, Object> node1 = new HashMap<>();
        node1.put("id", 201L);
        node1.put("lat", 26.9125);
        node1.put("lon", 75.7874);
        Map<String, String> tags1 = new HashMap<>();
        tags1.put("name", "Hawa Mahal (Palace of Winds)");
        tags1.put("tourism", "attraction");
        node1.put("tags", tags1);

        // Duplicate instance with slight name variation
        Map<String, Object> node2 = new HashMap<>();
        node2.put("id", 202L);
        node2.put("lat", 26.9126);
        node2.put("lon", 75.7875);
        Map<String, String> tags2 = new HashMap<>();
        tags2.put("name", "Hawa Mahal");
        tags2.put("tourism", "attraction");
        tags2.put("website", "https://hawa-mahal.com");
        node2.put("tags", tags2);

        // Very distant node (>50km away) that should be filtered out
        Map<String, Object> distantNode = new HashMap<>();
        distantNode.put("id", 203L);
        distantNode.put("lat", 27.8000);
        distantNode.put("lon", 76.5000);
        Map<String, String> distantTags = new HashMap<>();
        distantTags.put("name", "Faraway Resort");
        distantTags.put("tourism", "hotel");
        distantNode.put("tags", distantTags);

        Map<String, Object> overpassBody = new HashMap<>();
        overpassBody.put("elements", List.of(node1, node2, distantNode));

        ResponseEntity<Map> mockEntity = new ResponseEntity<>(overpassBody, HttpStatus.OK);
        when(restTemplate.exchange(any(java.net.URI.class), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(mockEntity);

        TravelGuideResponse res = enrichmentClient.enrich("Jaipur", "India", 26.9124, 75.7873, 10.0, 6);

        assertNotNull(res);
        // Only 1 Hawa Mahal should remain after deduplication
        assertEquals(1, res.getAttractions().size());
        assertTrue(res.getAttractions().get(0).getTitle().contains("Hawa Mahal"));
        // The distant hotel (>50km away) must be pruned
        assertTrue(res.getHotels().isEmpty());
    }

    @Test
    @DisplayName("API Error / Downtime - Degrades gracefully without breaking")
    void testEnrich_ApiDowntime_DegradesGracefully() {
        when(restTemplate.exchange(any(java.net.URI.class), any(HttpMethod.class), any(HttpEntity.class), eq(Map.class)))
                .thenThrow(new RuntimeException("Connection refused"));

        TravelGuideResponse res = enrichmentClient.enrich("Jaipur", "India", 26.9124, 75.7873, 10.0, 6);
        assertNotNull(res);
        assertFalse(res.isAvailable());
        assertTrue(res.getAttractions().isEmpty());
        assertTrue(res.getHotels().isEmpty());
    }
}
