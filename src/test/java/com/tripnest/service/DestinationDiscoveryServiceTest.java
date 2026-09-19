package com.tripnest.service;

import com.tripnest.dto.DestinationDetailsResponse;
import com.tripnest.dto.TravelGuideResponse;
import com.tripnest.dto.TravelMemoryResponse;
import com.tripnest.dto.TravelPlace;
import com.tripnest.dto.WeatherResponse;
import com.tripnest.dto.WikipediaResponse;
import com.tripnest.entity.Destination;
import com.tripnest.exception.ResourceNotFoundException;
import com.tripnest.repository.DestinationRepository;
import com.tripnest.repository.FavoriteDestinationRepository;
import com.tripnest.repository.TravelMemoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DestinationDiscoveryServiceTest {

    @Mock
    private DestinationRepository destinationRepository;

    @Mock
    private FavoriteDestinationRepository favoriteDestinationRepository;

    @Mock
    private TravelMemoryRepository travelMemoryRepository;

    @Mock
    private TravelMemoryService travelMemoryService;

    @Mock
    private WeatherService weatherService;

    @Mock
    private WikipediaService wikipediaService;

    @Mock
    private TravelGuideService travelGuideService;

    @InjectMocks
    private DestinationService destinationService;

    private Destination delhi;

    @BeforeEach
    void setUp() {
        delhi = new Destination();
        delhi.setId(1L);
        delhi.setName("Delhi");
        delhi.setState("Delhi");
        delhi.setCountry("India");
        delhi.setCategory("Historical");
        delhi.setDescription("Capital of India with rich history.");
        delhi.setImageUrl("https://images.unsplash.com/photo-1587475915356");
        delhi.setBestSeason("October to March");
        delhi.setEstimatedBudget(25000.0);
        delhi.setRecommendedDays(4);
        delhi.setLatitude(28.6139);
        delhi.setLongitude(77.2090);
        delhi.setRating(4.5);
    }

    @Test
    void getDestinationDetails_SuccessWithRichTravelGuide() {
        when(destinationRepository.findById(1L)).thenReturn(Optional.of(delhi));

        WeatherResponse mockWeather = WeatherResponse.builder()
                .temperature(25.0)
                .weatherCondition("Clear sky")
                .available(true)
                .build();
        when(weatherService.getCurrentWeather(28.6139, 77.2090)).thenReturn(mockWeather);

        WikipediaResponse mockWiki = WikipediaResponse.builder()
                .title("Delhi")
                .extract("Capital of India")
                .available(true)
                .build();
        when(wikipediaService.getWikipediaSummary("Delhi")).thenReturn(mockWiki);

        TravelGuideResponse mockGuide = TravelGuideResponse.builder()
                .attractions(Collections.singletonList(TravelPlace.builder().title("Red Fort").category("ATTRACTION").build()))
                .hotels(Collections.singletonList(TravelPlace.builder().title("The Imperial").category("HOTEL").build()))
                .food(Collections.singletonList(TravelPlace.builder().title("Mughlai Cuisine").category("FOOD").build()))
                .shopping(Collections.singletonList(TravelPlace.builder().title("Chandni Chowk").category("SHOPPING").build()))
                .available(true)
                .build();
        when(travelGuideService.getTravelGuide("Delhi", "India", 28.6139, 77.2090)).thenReturn(mockGuide);

        TravelMemoryResponse memoryExp = new TravelMemoryResponse();
        memoryExp.setId(10L);
        memoryExp.setTitle("Sunrise at India Gate");
        memoryExp.setVisibility("PUBLIC");
        when(travelMemoryService.getTop3PublicMemoriesByDestination(1L)).thenReturn(List.of(memoryExp));

        DestinationDetailsResponse response = destinationService.getDestinationDetails(1L);

        assertNotNull(response);
        assertNotNull(response.getDestination());
        assertEquals("Delhi", response.getDestination().getName());
        assertEquals("Historical", response.getDestination().getCategory());
        assertEquals(25000.0, response.getDestination().getEstimatedBudget());
        assertEquals(4, response.getDestination().getRecommendedDays());
        assertEquals("October to March", response.getDestination().getBestSeason());
        assertNotNull(response.getWeather());
        assertTrue(response.getWeather().isAvailable());
        assertNotNull(response.getWikipedia());
        assertTrue(response.getWikipedia().isAvailable());
        assertNotNull(response.getTravelGuide());
        assertTrue(response.getTravelGuide().isAvailable());
        assertEquals(1, response.getTravelGuide().getAttractions().size());
        assertEquals("Red Fort", response.getTravelGuide().getAttractions().get(0).getTitle());
        assertNotNull(response.getTravelerExperiences());
        assertEquals(1, response.getTravelerExperiences().size());
        assertEquals("Sunrise at India Gate", response.getTravelerExperiences().get(0).getTitle());
    }

    @Test
    void getDestinationDetails_NullTravelerExperiences_FallsBackToEmptyList() {
        when(destinationRepository.findById(1L)).thenReturn(Optional.of(delhi));
        when(travelMemoryService.getTop3PublicMemoriesByDestination(1L)).thenReturn(null);

        DestinationDetailsResponse response = destinationService.getDestinationDetails(1L);

        assertNotNull(response);
        assertNotNull(response.getTravelerExperiences());
        assertTrue(response.getTravelerExperiences().isEmpty());
    }

    @Test
    void deleteDestination_NullifiesMemoryReferencesAndDeletesFavorites() {
        when(destinationRepository.findById(1L)).thenReturn(Optional.of(delhi));

        destinationService.deleteDestination(1L);

        verify(favoriteDestinationRepository).deleteByDestinationId(1L);
        verify(travelMemoryRepository).nullifyDestinationReferences(1L);
        verify(destinationRepository).deleteById(1L);
    }

    @Test
    void getDestinationDetails_NotFound_ThrowsResourceNotFoundException() {
        when(destinationRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            destinationService.getDestinationDetails(999L);
        });
    }

    @Test
    void calculateDistance_ClampsExtremeValuesAndPreventsNaN() {
        // Distance between identical coordinates
        double distZero = destinationService.calculateDistance(28.6139, 77.2090, 28.6139, 77.2090);
        assertEquals(0.0, distZero);
        assertFalse(Double.isNaN(distZero));

        // Antipodal points (opposite sides of Earth)
        double distAntipodal = destinationService.calculateDistance(0.0, 0.0, 0.0, 180.0);
        assertTrue(distAntipodal > 19000);
        assertFalse(Double.isNaN(distAntipodal));
    }

    @Test
    void getDestinationDetails_ExternalFailures_GracefulFallback() {
        when(destinationRepository.findById(1L)).thenReturn(Optional.of(delhi));
        when(weatherService.getCurrentWeather(anyDouble(), anyDouble()))
                .thenThrow(new RuntimeException("Weather API offline"));
        when(wikipediaService.getWikipediaSummary(anyString()))
                .thenThrow(new RuntimeException("Wikipedia API offline"));
        when(travelGuideService.getTravelGuide(anyString(), anyString(), anyDouble(), anyDouble()))
                .thenThrow(new RuntimeException("OSM Overpass offline"));
        when(travelMemoryService.getTop3PublicMemoriesByDestination(1L))
                .thenThrow(new RuntimeException("Database timeout"));

        DestinationDetailsResponse response = destinationService.getDestinationDetails(1L);

        assertNotNull(response);
        assertNotNull(response.getDestination());
        assertEquals("Delhi", response.getDestination().getName());

        assertNotNull(response.getWeather());
        assertFalse(response.getWeather().isAvailable());

        assertNotNull(response.getWikipedia());
        assertFalse(response.getWikipedia().isAvailable());

        assertNotNull(response.getTravelGuide());
        assertFalse(response.getTravelGuide().isAvailable());

        assertNotNull(response.getTravelerExperiences());
        assertTrue(response.getTravelerExperiences().isEmpty());
    }

    @Test
    void getDestinationImageOnly_LightweightWithoutExternalCalls() {
        when(destinationRepository.findById(1L)).thenReturn(Optional.of(delhi));

        java.util.Map<String, String> imageRes = destinationService.getDestinationImageOnly(1L);

        assertNotNull(imageRes);
        assertEquals(delhi.getImageUrl(), imageRes.get("imageUrl"));

        verifyNoInteractions(weatherService, wikipediaService, travelGuideService);
    }
}

