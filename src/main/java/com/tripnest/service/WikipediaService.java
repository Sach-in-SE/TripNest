package com.tripnest.service;

import com.tripnest.dto.WikipediaResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class WikipediaService {

    private static final Logger logger = LoggerFactory.getLogger(WikipediaService.class);
    private static final long CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
    private static final int MAX_CACHE_SIZE = 100;
    public static final String WIKIPEDIA_ATTRIBUTION = "Source: Wikipedia";

    @Autowired
    private RestTemplate restTemplate;

    public static class CacheEntry {
        WikipediaResponse data;
        long timestamp;

        public CacheEntry(WikipediaResponse data, long timestamp) {
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

    public WikipediaResponse getWikipediaSummary(String destinationName) {
        if (destinationName == null || destinationName.trim().isEmpty()) {
            return WikipediaResponse.builder()
                    .available(false)
                    .attribution(WIKIPEDIA_ATTRIBUTION)
                    .build();
        }

        String key = destinationName.trim().toLowerCase();
        long now = System.currentTimeMillis();
        CacheEntry entry = cache.get(key);
        if (entry != null) {
            if ((now - entry.timestamp) < CACHE_TTL_MS) {
                return entry.data;
            } else {
                cache.remove(key);
            }
        }

        try {
            // First attempt: direct page summary REST API
            String encodedName = URLEncoder.encode(destinationName.trim(), StandardCharsets.UTF_8);
            String summaryUrl = "https://en.wikipedia.org/api/rest_v1/page/summary/" + encodedName;

            WikipediaResponse response = fetchSummaryFromUrl(summaryUrl);
            if (response != null && response.isAvailable()) {
                cache.put(key, new CacheEntry(response, now));
                return response;
            }

            // Second attempt: Search API to find exact article title
            String searchUrl = "https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch="
                    + encodedName + "&format=json";
            Map<?, ?> searchResult = restTemplate.getForObject(searchUrl, Map.class);
            if (searchResult != null && searchResult.containsKey("query")) {
                Map<?, ?> queryObj = (Map<?, ?>) searchResult.get("query");
                if (queryObj.containsKey("search")) {
                    List<?> searchList = (List<?>) queryObj.get("search");
                    if (!searchList.isEmpty()) {
                        Map<?, ?> firstItem = (Map<?, ?>) searchList.get(0);
                        String foundTitle = (String) firstItem.get("title");
                        if (foundTitle != null && !foundTitle.isEmpty()) {
                            String targetSummaryUrl = "https://en.wikipedia.org/api/rest_v1/page/summary/"
                                    + URLEncoder.encode(foundTitle, StandardCharsets.UTF_8);
                            WikipediaResponse searchedResponse = fetchSummaryFromUrl(targetSummaryUrl);
                            if (searchedResponse != null && searchedResponse.isAvailable()) {
                                cache.put(key, new CacheEntry(searchedResponse, now));
                                return searchedResponse;
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.warn("Failed to fetch Wikipedia summary for '{}': {}", destinationName, e.getMessage());
        }

        WikipediaResponse fallback = WikipediaResponse.builder()
                .available(false)
                .attribution(WIKIPEDIA_ATTRIBUTION)
                .build();
        cache.put(key, new CacheEntry(fallback, now));
        return fallback;
    }

    private WikipediaResponse fetchSummaryFromUrl(String url) {
        try {
            Map<?, ?> res = restTemplate.getForObject(url, Map.class);
            if (res != null && res.containsKey("extract")) {
                String title = (String) res.get("title");
                String extract = (String) res.get("extract");
                String pageUrl = null;
                String imageUrl = null;

                if (res.containsKey("content_urls")) {
                    Map<?, ?> contentUrls = (Map<?, ?>) res.get("content_urls");
                    if (contentUrls != null && contentUrls.containsKey("desktop")) {
                        Map<?, ?> desktop = (Map<?, ?>) contentUrls.get("desktop");
                        if (desktop != null) {
                            pageUrl = (String) desktop.get("page");
                        }
                    }
                }

                if (res.containsKey("originalimage")) {
                    Map<?, ?> orig = (Map<?, ?>) res.get("originalimage");
                    if (orig != null && orig.containsKey("source")) {
                        imageUrl = (String) orig.get("source");
                    }
                }
                if (imageUrl == null && res.containsKey("thumbnail")) {
                    Map<?, ?> thumb = (Map<?, ?>) res.get("thumbnail");
                    if (thumb != null && thumb.containsKey("source")) {
                        imageUrl = (String) thumb.get("source");
                    }
                }

                if (extract != null && !extract.trim().isEmpty()) {
                    return WikipediaResponse.builder()
                            .title(title)
                            .extract(extract)
                            .pageUrl(pageUrl)
                            .imageUrl(imageUrl)
                            .available(true)
                            .attribution(WIKIPEDIA_ATTRIBUTION)
                            .build();
                }
            }
        } catch (Exception e) {
            logger.debug("Wikipedia REST summary call failed for URL {}: {}", url, e.getMessage());
        }
        return null;
    }
}
