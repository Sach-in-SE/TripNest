package com.tripnest.service;

import com.tripnest.dto.WeatherResponse;
import com.tripnest.dto.WeatherResponse.DailyForecast;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class WeatherService {

    private static final Logger logger = LoggerFactory.getLogger(WeatherService.class);
    private static final long CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
    private static final int MAX_CACHE_SIZE = 100;
    public static final String OPEN_METEO_ATTRIBUTION = "Weather data provided by Open-Meteo";

    @Autowired
    private RestTemplate restTemplate;

    public static class CacheEntry {
        WeatherResponse data;
        long timestamp;

        public CacheEntry(WeatherResponse data, long timestamp) {
            this.data = data;
            this.timestamp = timestamp;
        }
    }

    private final Map<String, CacheEntry> cache = Collections.synchronizedMap(
        new LinkedHashMap<String, CacheEntry>(MAX_CACHE_SIZE, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<String, CacheEntry> eldest) {
                return size() > MAX_CACHE_SIZE || (System.currentTimeMillis() - eldest.getValue().timestamp) >= CACHE_TTL_MS;
            }
        }
    );

    public int getCacheSize() {
        return cache.size();
    }

    public void clearCache() {
        cache.clear();
    }

    public WeatherResponse getCurrentWeather(Double latitude, Double longitude) {
        if (latitude == null || longitude == null) {
            return WeatherResponse.builder()
                    .available(false)
                    .attribution(OPEN_METEO_ATTRIBUTION)
                    .build();
        }

        String cacheKey = String.format(Locale.US, "%.2f_%.2f", latitude, longitude);
        long now = System.currentTimeMillis();
        CacheEntry entry = cache.get(cacheKey);
        if (entry != null) {
            if ((now - entry.timestamp) < CACHE_TTL_MS) {
                return entry.data;
            } else {
                cache.remove(cacheKey);
            }
        }

        try {
            String url = String.format(Locale.US,
                    "https://api.open-meteo.com/v1/forecast?latitude=%.4f&longitude=%.4f&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto",
                    latitude, longitude);

            Map<?, ?> response = restTemplate.getForObject(url, Map.class);
            if (response != null && response.containsKey("current")) {
                Map<?, ?> current = (Map<?, ?>) response.get("current");

                Number temp = (Number) current.get("temperature_2m");
                Number appTemp = (Number) current.get("apparent_temperature");
                Number humidity = (Number) current.get("relative_humidity_2m");
                Number windSpeed = (Number) current.get("wind_speed_10m");
                Number weatherCode = (Number) current.get("weather_code");
                String time = (String) current.get("time");

                int code = weatherCode != null ? weatherCode.intValue() : -1;
                String condition = mapWeatherCodeToCondition(code);

                List<DailyForecast> forecastList = new ArrayList<>();
                if (response.containsKey("daily")) {
                    Map<?, ?> daily = (Map<?, ?>) response.get("daily");
                    if (daily != null) {
                        List<?> times = (List<?>) daily.get("time");
                        List<?> codes = (List<?>) daily.get("weather_code");
                        List<?> maxTemps = (List<?>) daily.get("temperature_2m_max");
                        List<?> minTemps = (List<?>) daily.get("temperature_2m_min");

                        if (times != null) {
                            int count = Math.min(5, times.size());
                            for (int i = 0; i < count; i++) {
                                String dateStr = (String) times.get(i);
                                Number codeNum = (codes != null && i < codes.size()) ? (Number) codes.get(i) : null;
                                Number maxNum = (maxTemps != null && i < maxTemps.size()) ? (Number) maxTemps.get(i) : null;
                                Number minNum = (minTemps != null && i < minTemps.size()) ? (Number) minTemps.get(i) : null;

                                int wCode = codeNum != null ? codeNum.intValue() : -1;
                                forecastList.add(DailyForecast.builder()
                                        .date(dateStr)
                                        .tempMax(maxNum != null ? maxNum.doubleValue() : null)
                                        .tempMin(minNum != null ? minNum.doubleValue() : null)
                                        .weatherCode(wCode)
                                        .weatherCondition(mapWeatherCodeToCondition(wCode))
                                        .build());
                            }
                        }
                    }
                }

                WeatherResponse weather = WeatherResponse.builder()
                        .temperature(temp != null ? temp.doubleValue() : null)
                        .apparentTemperature(appTemp != null ? appTemp.doubleValue() : null)
                        .weatherCondition(condition)
                        .humidity(humidity != null ? humidity.intValue() : null)
                        .windSpeed(windSpeed != null ? windSpeed.doubleValue() : null)
                        .weatherCode(code)
                        .lastUpdated(time != null ? time : LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                        .forecast(forecastList)
                        .available(true)
                        .attribution(OPEN_METEO_ATTRIBUTION)
                        .build();

                cache.put(cacheKey, new CacheEntry(weather, now));
                return weather;
            }
        } catch (Exception e) {
            logger.warn("Failed to fetch weather from Open-Meteo for lat={}, lon={}: {}", latitude, longitude, e.getMessage());
        }

        return WeatherResponse.builder()
                .available(false)
                .attribution(OPEN_METEO_ATTRIBUTION)
                .build();
    }

    public static String mapWeatherCodeToCondition(int code) {
        switch (code) {
            case 0: return "Clear sky";
            case 1: return "Mainly clear";
            case 2: return "Partly cloudy";
            case 3: return "Overcast";
            case 45: return "Fog";
            case 48: return "Depositing rime fog";
            case 51: return "Light drizzle";
            case 53: return "Moderate drizzle";
            case 55: return "Dense drizzle";
            case 56: return "Light freezing drizzle";
            case 57: return "Dense freezing drizzle";
            case 61: return "Slight rain";
            case 63: return "Moderate rain";
            case 65: return "Heavy rain";
            case 66: return "Light freezing rain";
            case 67: return "Heavy freezing rain";
            case 71: return "Slight snow fall";
            case 73: return "Moderate snow fall";
            case 75: return "Heavy snow fall";
            case 77: return "Snow grains";
            case 80: return "Slight rain showers";
            case 81: return "Moderate rain showers";
            case 82: return "Violent rain showers";
            case 85: return "Slight snow showers";
            case 86: return "Heavy snow showers";
            case 95: return "Thunderstorm";
            case 96: return "Thunderstorm with slight hail";
            case 99: return "Thunderstorm with heavy hail";
            default: return "Unknown";
        }
    }
}
