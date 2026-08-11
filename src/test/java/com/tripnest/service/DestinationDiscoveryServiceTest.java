package com.tripnest.service;

import com.tripnest.dto.DestinationDetailsResponse;
import com.tripnest.dto.DestinationResponse;
import com.tripnest.dto.WeatherResponse;
import com.tripnest.dto.WikipediaResponse;
import com.tripnest.entity.Destination;
import com.tripnest.exception.ResourceNotFoundException;
import com.tripnest.repository.DestinationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DestinationDiscoveryServiceTest {

    @Mock
    private DestinationRepository destinationRepository;

    @Mock
    private WeatherService weatherService;

    @Mock
    private WikipediaService wikipediaService;

    @InjectMocks
    private DestinationService destinationService;

    private Destination delhi;
    private Destination agra;
    private Destination jaipur;

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

        agra = new Destination();
        agra.setId(2L);
        agra.setName("Agra");
        agra.setState("Uttar Pradesh");
        agra.setCountry("India");
        agra.setCategory("Historical");
        agra.setDescription("Home to Taj Mahal.");
        agra.setImageUrl("https://images.unsplash.com/photo-1564507592333");
        agra.setBestSeason("October to March");
        agra.setEstimatedBudget(15000.0);
        agra.setRecommendedDays(2);
        agra.setLatitude(27.1751);
        agra.setLongitude(78.0421);
        agra.setRating(4.8);

        jaipur = new Destination();
        jaipur.setId(3L);
        jaipur.setName("Jaipur");
        jaipur.setState("Rajasthan");
        jaipur.setCountry("India");
        jaipur.setCategory("Historical");
        jaipur.setDescription("Pink city of India.");
        jaipur.setImageUrl("https://images.unsplash.com/photo-1477584110986");
        jaipur.setBestSeason("October to March");
        jaipur.setEstimatedBudget(20000.0);
        jaipur.setRecommendedDays(3);
        jaipur.setLatitude(26.9124);
        jaipur.setLongitude(75.7873);
        jaipur.setRating(4.6);
    }

    @Test
    void getNearbyDestinations_CalculatesDistanceAndExcludesSelf() {
        when(destinationRepository.findById(1L)).thenReturn(Optional.of(delhi));
        when(destinationRepository.findAll()).thenReturn(Arrays.asList(delhi, agra, jaipur));

        List<DestinationResponse> nearby = destinationService.getNearbyDestinations(1L, 5);

        assertNotNull(nearby);
        assertEquals(2, nearby.size());
        // Delhi (1L) must be excluded
        assertTrue(nearby.stream().noneMatch(d -> d.getId().equals(1L)));

        // Agra (~180km) is closer to Delhi than Jaipur (~240km)
        assertEquals("Agra", nearby.get(0).getName());
        assertNotNull(nearby.get(0).getDistanceKm());
        assertTrue(nearby.get(0).getDistanceKm() > 0);
        assertEquals("Jaipur", nearby.get(1).getName());
        assertTrue(nearby.get(1).getDistanceKm() > nearby.get(0).getDistanceKm());
    }

    @Test
    void getNearbyDestinations_MissingCoordinates_ReturnsEmpty() {
        Destination noCoords = new Destination();
        noCoords.setId(4L);
        noCoords.setName("UnknownPlace");

        when(destinationRepository.findById(4L)).thenReturn(Optional.of(noCoords));

        List<DestinationResponse> nearby = destinationService.getNearbyDestinations(4L, 5);

        assertNotNull(nearby);
        assertTrue(nearby.isEmpty());
    }

    @Test
    void getDestinationDetails_Success() {
        when(destinationRepository.findById(1L)).thenReturn(Optional.of(delhi));
        when(destinationRepository.findAll()).thenReturn(Arrays.asList(delhi, agra, jaipur));

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
        assertNotNull(response.getNearbyDestinations());
        assertEquals(2, response.getNearbyDestinations().size());
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
}
