package com.tripnest.service;

import com.tripnest.dto.WeatherResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WeatherServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private WeatherService weatherService;

    @BeforeEach
    void setUp() {
        weatherService.clearCache();
    }

    @Test
    void getCurrentWeather_Success() {
        Map<String, Object> mockCurrent = new HashMap<>();
        mockCurrent.put("temperature_2m", 25.5);
        mockCurrent.put("apparent_temperature", 26.0);
        mockCurrent.put("relative_humidity_2m", 60);
        mockCurrent.put("wind_speed_10m", 12.5);
        mockCurrent.put("weather_code", 0);
        mockCurrent.put("time", "2026-08-11T12:00");

        Map<String, Object> mockResponse = new HashMap<>();
        mockResponse.put("current", mockCurrent);

        when(restTemplate.getForObject(anyString(), eq(Map.class))).thenReturn(mockResponse);

        WeatherResponse result = weatherService.getCurrentWeather(28.6139, 77.2090);

        assertNotNull(result);
        assertTrue(result.isAvailable());
        assertEquals(25.5, result.getTemperature());
        assertEquals(26.0, result.getApparentTemperature());
        assertEquals("Clear sky", result.getWeatherCondition());
        assertEquals(60, result.getHumidity());
        assertEquals(12.5, result.getWindSpeed());
        assertEquals(0, result.getWeatherCode());
        assertEquals("Weather data provided by Open-Meteo", result.getAttribution());
    }

    @Test
    void getCurrentWeather_UsesCacheOnRepeatedRequests() {
        Map<String, Object> mockCurrent = new HashMap<>();
        mockCurrent.put("temperature_2m", 25.5);
        mockCurrent.put("weather_code", 0);

        Map<String, Object> mockResponse = new HashMap<>();
        mockResponse.put("current", mockCurrent);

        when(restTemplate.getForObject(anyString(), eq(Map.class))).thenReturn(mockResponse);

        WeatherResponse first = weatherService.getCurrentWeather(28.6139, 77.2090);
        WeatherResponse second = weatherService.getCurrentWeather(28.6139, 77.2090);

        assertSame(first, second);
        verify(restTemplate, times(1)).getForObject(anyString(), eq(Map.class));
        assertEquals(1, weatherService.getCacheSize());
    }

    @Test
    void getCurrentWeather_ApiFailure_ReturnsFallback() {
        when(restTemplate.getForObject(anyString(), eq(Map.class)))
                .thenThrow(new RestClientException("Connection timeout"));

        WeatherResponse result = weatherService.getCurrentWeather(15.2993, 74.1240);

        assertNotNull(result);
        assertFalse(result.isAvailable());
        assertEquals("Weather data provided by Open-Meteo", result.getAttribution());
        assertNull(result.getTemperature());
    }

    @Test
    void getCurrentWeather_MissingCoordinates_ReturnsFallback() {
        WeatherResponse result = weatherService.getCurrentWeather(null, 77.2090);

        assertNotNull(result);
        assertFalse(result.isAvailable());
        assertEquals("Weather data provided by Open-Meteo", result.getAttribution());
    }
}
