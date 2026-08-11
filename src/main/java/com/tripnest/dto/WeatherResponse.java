package com.tripnest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeatherResponse {
    private Double temperature;
    private Double apparentTemperature;
    private String weatherCondition;
    private Integer humidity;
    private Double windSpeed;
    private Integer weatherCode;
    private String lastUpdated;
    private boolean available;
    private String attribution;
    private List<DailyForecast> forecast;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyForecast {
        private String date;
        private Double tempMax;
        private Double tempMin;
        private Integer weatherCode;
        private String weatherCondition;
    }
}
