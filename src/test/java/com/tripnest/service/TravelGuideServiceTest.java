package com.tripnest.service;

import com.tripnest.dto.TravelGuideResponse;
import com.tripnest.dto.TravelPlace;
import com.tripnest.service.enrichment.TravelEnrichmentClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TravelGuideServiceTest {

    @Mock
    private TravelEnrichmentClient travelEnrichmentClient;

    @InjectMocks
    private TravelGuideService travelGuideService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(travelGuideService, "searchRadiusKm", 10.0);
        ReflectionTestUtils.setField(travelGuideService, "cacheTtlMs", 3600000L);
        ReflectionTestUtils.setField(travelGuideService, "maxResultsPerCategory", 6);
        travelGuideService.clearCache();
    }

    @Test
    @DisplayName("Enrichment Success - Delegates to client and caches response")
    void testGetTravelGuide_Success() {
        TravelGuideResponse mockResponse = TravelGuideResponse.builder()
                .attractions(Collections.singletonList(TravelPlace.builder().title("Hawa Mahal").category("ATTRACTION").build()))
                .hotels(Collections.singletonList(TravelPlace.builder().title("Umaid Bhawan").category("HOTEL").build()))
                .food(Collections.singletonList(TravelPlace.builder().title("Laxmi Mishthan Bhandar").category("FOOD").build()))
                .shopping(Collections.singletonList(TravelPlace.builder().title("Johari Bazaar").category("SHOPPING").build()))
                .available(true)
                .attribution("© OpenStreetMap contributors & Wikipedia")
                .build();

        when(travelEnrichmentClient.enrich(eq("Jaipur"), eq("India"), eq(26.9124), eq(75.7873), eq(10.0), eq(6)))
                .thenReturn(mockResponse);

        TravelGuideResponse result1 = travelGuideService.getTravelGuide("Jaipur", "India", 26.9124, 75.7873);
        assertNotNull(result1);
        assertTrue(result1.isAvailable());
        assertEquals(1, result1.getAttractions().size());
        assertEquals("Hawa Mahal", result1.getAttractions().get(0).getTitle());
        assertEquals("Umaid Bhawan", result1.getHotels().get(0).getTitle());
        assertEquals("Laxmi Mishthan Bhandar", result1.getFood().get(0).getTitle());
        assertEquals("Johari Bazaar", result1.getShopping().get(0).getTitle());

        // Cache hit test - second call should not invoke client
        TravelGuideResponse result2 = travelGuideService.getTravelGuide("Jaipur", "India", 26.9124, 75.7873);
        assertSame(result1, result2);
        verify(travelEnrichmentClient, times(1)).enrich(anyString(), anyString(), anyDouble(), anyDouble(), anyDouble(), anyInt());
    }

    @Test
    @DisplayName("Null Coordinates - Returns unavailable without throwing exceptions")
    void testGetTravelGuide_NullCoordinates() {
        TravelGuideResponse res = travelGuideService.getTravelGuide("Jaipur", "India", null, null);
        assertNotNull(res);
        assertFalse(res.isAvailable());
        assertTrue(res.getAttractions().isEmpty());
        verifyNoInteractions(travelEnrichmentClient);
    }

    @Test
    @DisplayName("Invalid / Out of range Coordinates - Returns unavailable safely")
    void testGetTravelGuide_InvalidOutOfRangeCoordinates() {
        TravelGuideResponse res1 = travelGuideService.getTravelGuide("Test", "World", 95.0, 75.0);
        assertNotNull(res1);
        assertFalse(res1.isAvailable());

        TravelGuideResponse res2 = travelGuideService.getTravelGuide("Test", "World", 25.0, 200.0);
        assertNotNull(res2);
        assertFalse(res2.isAvailable());

        TravelGuideResponse res3 = travelGuideService.getTravelGuide("Test", "World", Double.NaN, 75.0);
        assertNotNull(res3);
        assertFalse(res3.isAvailable());

        verifyNoInteractions(travelEnrichmentClient);
    }

    @Test
    @DisplayName("Empty Client Result - Returns unavailable without caching empty failures permanently")
    void testGetTravelGuide_EmptyClientResult() {
        TravelGuideResponse emptyResponse = TravelGuideResponse.builder()
                .attractions(Collections.emptyList())
                .hotels(Collections.emptyList())
                .food(Collections.emptyList())
                .shopping(Collections.emptyList())
                .available(false)
                .build();

        when(travelEnrichmentClient.enrich(anyString(), anyString(), anyDouble(), anyDouble(), anyDouble(), anyInt()))
                .thenReturn(emptyResponse);

        TravelGuideResponse res = travelGuideService.getTravelGuide("Remote Island", "World", 0.0, 0.0);
        assertNotNull(res);
        assertFalse(res.isAvailable());
        assertEquals(0, travelGuideService.getCacheSize());
    }

    @Test
    @DisplayName("Client Throws Exception - Fails gracefully to empty response")
    void testGetTravelGuide_ClientException_DegradesGracefully() {
        when(travelEnrichmentClient.enrich(anyString(), anyString(), anyDouble(), anyDouble(), anyDouble(), anyInt()))
                .thenThrow(new RuntimeException("Connection timeout"));

        TravelGuideResponse res = travelGuideService.getTravelGuide("Jaipur", "India", 26.9124, 75.7873);
        assertNotNull(res);
        assertFalse(res.isAvailable());
        assertTrue(res.getAttractions().isEmpty());
        assertTrue(res.getHotels().isEmpty());
        assertTrue(res.getFood().isEmpty());
        assertTrue(res.getShopping().isEmpty());
    }
}
