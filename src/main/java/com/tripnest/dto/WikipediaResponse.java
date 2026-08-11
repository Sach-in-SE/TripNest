package com.tripnest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WikipediaResponse {
    private String title;
    private String extract;
    private String pageUrl;
    private String imageUrl;
    private boolean available;
    private String attribution;
}
