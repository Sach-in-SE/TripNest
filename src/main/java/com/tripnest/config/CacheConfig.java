package com.tripnest.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.concurrent.TimeUnit;

@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        SimpleCacheManager manager = new SimpleCacheManager();

        CaffeineCache destinationsCache = new CaffeineCache("destinations",
                Caffeine.newBuilder()
                        .expireAfterWrite(1, TimeUnit.HOURS)
                        .maximumSize(500)
                        .recordStats()
                        .build());

        CaffeineCache destinationImageCache = new CaffeineCache("destination-image",
                Caffeine.newBuilder()
                        .expireAfterWrite(24, TimeUnit.HOURS)
                        .maximumSize(1000)
                        .recordStats()
                        .build());

        CaffeineCache weatherCache = new CaffeineCache("weather",
                Caffeine.newBuilder()
                        .expireAfterWrite(15, TimeUnit.MINUTES)
                        .maximumSize(500)
                        .recordStats()
                        .build());

        CaffeineCache wikipediaCache = new CaffeineCache("wikipedia",
                Caffeine.newBuilder()
                        .expireAfterWrite(2, TimeUnit.HOURS)
                        .maximumSize(500)
                        .recordStats()
                        .build());

        CaffeineCache travelGuideCache = new CaffeineCache("travel-guide",
                Caffeine.newBuilder()
                        .expireAfterWrite(24, TimeUnit.HOURS)
                        .maximumSize(500)
                        .recordStats()
                        .build());

        CaffeineCache destinationsListCache = new CaffeineCache("destinations-list",
                Caffeine.newBuilder()
                        .expireAfterWrite(1, TimeUnit.HOURS)
                        .maximumSize(100)
                        .recordStats()
                        .build());

        CaffeineCache adminStatsCache = new CaffeineCache("admin-stats",
                Caffeine.newBuilder()
                        .expireAfterWrite(5, TimeUnit.MINUTES)
                        .maximumSize(10)
                        .recordStats()
                        .build());

        manager.setCaches(Arrays.asList(
                destinationsCache,
                destinationsListCache,
                destinationImageCache,
                weatherCache,
                wikipediaCache,
                travelGuideCache,
                adminStatsCache
        ));
        manager.afterPropertiesSet();

        return manager;
    }
}
