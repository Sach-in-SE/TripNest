package com.tripnest.service;

import com.tripnest.dto.WikipediaResponse;
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
class WikipediaServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private WikipediaService wikipediaService;

    @BeforeEach
    void setUp() {
        wikipediaService.clearCache();
    }

    @Test
    void getWikipediaSummary_Success() {
        Map<String, Object> desktopMap = new HashMap<>();
        desktopMap.put("page", "https://en.wikipedia.org/wiki/Delhi");

        Map<String, Object> contentUrlsMap = new HashMap<>();
        contentUrlsMap.put("desktop", desktopMap);

        Map<String, Object> mockResponse = new HashMap<>();
        mockResponse.put("title", "Delhi");
        mockResponse.put("extract", "Delhi, officially the National Capital Territory of Delhi, is a city and a union territory of India.");
        mockResponse.put("content_urls", contentUrlsMap);

        when(restTemplate.getForObject(anyString(), eq(Map.class))).thenReturn(mockResponse);

        WikipediaResponse result = wikipediaService.getWikipediaSummary("Delhi");

        assertNotNull(result);
        assertTrue(result.isAvailable());
        assertEquals("Delhi", result.getTitle());
        assertTrue(result.getExtract().contains("National Capital Territory of Delhi"));
        assertEquals("https://en.wikipedia.org/wiki/Delhi", result.getPageUrl());
        assertEquals("Source: Wikipedia", result.getAttribution());
    }

    @Test
    void getWikipediaSummary_UsesCacheOnRepeatedRequests() {
        Map<String, Object> mockResponse = new HashMap<>();
        mockResponse.put("title", "Delhi");
        mockResponse.put("extract", "Capital of India");

        when(restTemplate.getForObject(anyString(), eq(Map.class))).thenReturn(mockResponse);

        WikipediaResponse first = wikipediaService.getWikipediaSummary("Delhi");
        WikipediaResponse second = wikipediaService.getWikipediaSummary("Delhi");

        assertSame(first, second);
        verify(restTemplate, times(1)).getForObject(anyString(), eq(Map.class));
        assertEquals(1, wikipediaService.getCacheSize());
    }

    @Test
    void getWikipediaSummary_NotFound_ReturnsFallback() {
        when(restTemplate.getForObject(anyString(), eq(Map.class))).thenReturn(null);

        WikipediaResponse result = wikipediaService.getWikipediaSummary("NonExistentPlace12345");

        assertNotNull(result);
        assertFalse(result.isAvailable());
        assertEquals("Source: Wikipedia", result.getAttribution());
        assertNull(result.getExtract());
    }

    @Test
    void getWikipediaSummary_ApiFailure_ReturnsFallback() {
        when(restTemplate.getForObject(anyString(), eq(Map.class)))
                .thenThrow(new RestClientException("Network Error"));

        WikipediaResponse result = wikipediaService.getWikipediaSummary("Agra");

        assertNotNull(result);
        assertFalse(result.isAvailable());
        assertEquals("Source: Wikipedia", result.getAttribution());
    }
}
