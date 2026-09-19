package com.tripnest.service;

import com.tripnest.dto.DestinationDetailsResponse;
import com.tripnest.dto.DestinationRequest;
import com.tripnest.dto.DestinationResponse;
import com.tripnest.dto.TravelGuideResponse;
import com.tripnest.dto.TravelMemoryResponse;
import com.tripnest.dto.WeatherResponse;
import com.tripnest.dto.WikipediaResponse;
import com.tripnest.entity.Destination;
import com.tripnest.exception.ResourceNotFoundException;
import com.tripnest.repository.DestinationRepository;
import com.tripnest.repository.FavoriteDestinationRepository;
import com.tripnest.repository.TravelMemoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class DestinationService {

    private static final Logger logger = LoggerFactory.getLogger(DestinationService.class);

    private final ExecutorService enrichmentExecutor = new ThreadPoolExecutor(
            2, 8, 60L, TimeUnit.SECONDS,
            new LinkedBlockingQueue<>(100),
            new ThreadPoolExecutor.CallerRunsPolicy()
    );

    @Autowired
    private DestinationRepository destinationRepository;

    @Autowired
    private FavoriteDestinationRepository favoriteDestinationRepository;

    @Autowired
    private TravelMemoryRepository travelMemoryRepository;

    @Autowired
    private WeatherService weatherService;

    @Autowired
    private WikipediaService wikipediaService;

    @Autowired
    private TravelGuideService travelGuideService;

    @Autowired
    private TravelMemoryService travelMemoryService;

    @Autowired(required = false)
    private org.springframework.cache.CacheManager cacheManager;

    @Transactional
    @CacheEvict(value = {"destinations", "destination-image", "destinations-list"}, allEntries = true)
    public DestinationResponse createDestination(DestinationRequest request) {
        String name = request.getName() != null ? request.getName().trim() : "";
        String state = request.getState() != null ? request.getState().trim() : "";
        String country = request.getCountry() != null ? request.getCountry().trim() : "";

        if (destinationRepository.existsByNameIgnoreCaseAndStateIgnoreCaseAndCountryIgnoreCase(name, state, country)
                || destinationRepository.existsByName(name)) {
            throw new RuntimeException("Destination with this name already exists");
        }

        Destination destination = new Destination();
        destination.setName(name);
        destination.setState(state);
        destination.setCountry(country);
        destination.setDescription(request.getDescription() != null ? request.getDescription().trim() : "");
        destination.setCategory(request.getCategory() != null ? request.getCategory().trim() : "General");
        destination.setImageUrl(request.getImageUrl() != null ? request.getImageUrl().trim() : null);
        destination.setBestSeason(request.getBestSeason() != null ? request.getBestSeason().trim() : null);
        destination.setEstimatedBudget(request.getEstimatedBudget() != null ? request.getEstimatedBudget() : 0.0);
        destination.setRecommendedDays(request.getRecommendedDays() != null ? request.getRecommendedDays() : 3);
        destination.setLatitude(request.getLatitude());
        destination.setLongitude(request.getLongitude());
        destination.setRating(request.getRating() != null ? request.getRating() : 4.0);
        destination.setPopular(false);

        Destination saved = destinationRepository.save(destination);
        return mapToResponse(saved);
    }

    @Cacheable(value = "destinations-list", key = "'all'", sync = true)
    public List<DestinationResponse> getAllDestinations() {
        return destinationRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<DestinationResponse> searchDestinations(String query) {
        return destinationRepository.findByNameContainingIgnoreCaseOrStateContainingIgnoreCaseOrCountryContainingIgnoreCase(query, query, query)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Cacheable(value = "destinations-list", key = "'cat:' + #category", sync = true)
    public List<DestinationResponse> filterByCategory(String category) {
        return destinationRepository.findByCategoryIgnoreCase(category)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Cacheable(value = "destinations-list", key = "'sort:' + (#sortBy != null ? #sortBy.toLowerCase() : 'all')", sync = true)
    public List<DestinationResponse> sortDestinations(String sortBy) {
        List<Destination> destinations;
        if (sortBy == null) {
            destinations = destinationRepository.findAll();
        } else {
            switch (sortBy.toLowerCase()) {
                case "name":
                    destinations = destinationRepository.findAllByOrderByNameAsc();
                    break;
                case "rating":
                    destinations = destinationRepository.findAllByOrderByRatingDesc();
                    break;
                case "budget":
                    destinations = destinationRepository.findAllByOrderByEstimatedBudgetAsc();
                    break;
                default:
                    destinations = destinationRepository.findAll();
            }
        }
        return destinations.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public DestinationResponse getDestinationById(Long id) {
        Destination destination = destinationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Destination not found with id: " + id));
        return mapToResponse(destination);
    }

    @Cacheable(value = "destinations", key = "#id", sync = true)
    public DestinationDetailsResponse getDestinationDetails(Long id) {
        Destination destination = destinationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Destination not found with id: " + id));

        DestinationResponse destResponse = mapToResponse(destination);

        // Concurrently enrich weather, wikipedia, travel guide, and memories
        CompletableFuture<WeatherResponse> weatherFuture = CompletableFuture.supplyAsync(() -> {
            try {
                return weatherService.getCurrentWeather(destination.getLatitude(), destination.getLongitude());
            } catch (Exception e) {
                logger.warn("Weather fetch failed for destination {}: {}", destination.getName(), e.getMessage());
                return WeatherResponse.builder().available(false).attribution(WeatherService.OPEN_METEO_ATTRIBUTION).build();
            }
        }, enrichmentExecutor);

        CompletableFuture<WikipediaResponse> wikiFuture = CompletableFuture.supplyAsync(() -> {
            try {
                return wikipediaService.getWikipediaSummary(destination.getName());
            } catch (Exception e) {
                logger.warn("Wikipedia fetch failed for destination {}: {}", destination.getName(), e.getMessage());
                return WikipediaResponse.builder().available(false).attribution(WikipediaService.WIKIPEDIA_ATTRIBUTION).build();
            }
        }, enrichmentExecutor);

        CompletableFuture<TravelGuideResponse> guideFuture = CompletableFuture.supplyAsync(() -> {
            try {
                return travelGuideService.getTravelGuide(
                        destination.getName(), destination.getCountry(),
                        destination.getLatitude(), destination.getLongitude());
            } catch (Exception e) {
                logger.warn("Travel guide fetch failed for destination {}: {}", destination.getName(), e.getMessage());
                return TravelGuideResponse.builder().available(false).attribution(TravelGuideService.DEFAULT_ATTRIBUTION).build();
            }
        }, enrichmentExecutor);

        CompletableFuture<List<TravelMemoryResponse>> memoriesFuture = CompletableFuture.supplyAsync(() -> {
            try {
                List<TravelMemoryResponse> memories = travelMemoryService.getTop3PublicMemoriesByDestination(id);
                return memories != null ? memories : Collections.<TravelMemoryResponse>emptyList();
            } catch (Exception e) {
                return Collections.<TravelMemoryResponse>emptyList();
            }
        }, enrichmentExecutor);

        WeatherResponse weatherFallback = WeatherResponse.builder().available(false).attribution(WeatherService.OPEN_METEO_ATTRIBUTION).build();
        WikipediaResponse wikiFallback = WikipediaResponse.builder().available(false).attribution(WikipediaService.WIKIPEDIA_ATTRIBUTION).build();
        TravelGuideResponse guideFallback = TravelGuideResponse.builder().available(false).attribution(TravelGuideService.DEFAULT_ATTRIBUTION).build();

        // Bounded micro-budget on critical path (total max 200ms across all futures concurrently)
        CompletableFuture<Void> boundedAll = CompletableFuture.allOf(weatherFuture, wikiFuture, guideFuture, memoriesFuture);
        try {
            boundedAll.get(200, TimeUnit.MILLISECONDS);
        } catch (Exception ignored) {
            // Micro-budget elapsed: proceed immediately with whatever is ready
        }

        WeatherResponse weather = weatherFuture.getNow(weatherFallback);
        WikipediaResponse wikipedia = wikiFuture.getNow(wikiFallback);
        TravelGuideResponse travelGuide = guideFuture.getNow(guideFallback);
        List<TravelMemoryResponse> travelerExperiences = memoriesFuture.getNow(Collections.emptyList());

        final List<TravelMemoryResponse> finalTravelerExperiences = travelerExperiences;

        // Asynchronous cache self-healing: when background enrichments finish, update cache automatically
        CompletableFuture.allOf(weatherFuture, wikiFuture, guideFuture).thenAcceptAsync(v -> {
            try {
                WeatherResponse w = weatherFuture.getNow(weatherFallback);
                WikipediaResponse wk = wikiFuture.getNow(wikiFallback);
                TravelGuideResponse tg = guideFuture.getNow(guideFallback);
                if ((w != null && w.isAvailable()) || (tg != null && tg.isAvailable()) || (wk != null && wk.isAvailable())) {
                    DestinationDetailsResponse enriched = DestinationDetailsResponse.builder()
                            .destination(destResponse)
                            .weather(w != null ? w : weatherFallback)
                            .wikipedia(wk != null ? wk : wikiFallback)
                            .travelGuide(tg != null ? tg : guideFallback)
                            .travelerExperiences(finalTravelerExperiences != null ? finalTravelerExperiences : Collections.emptyList())
                            .build();
                    if (cacheManager != null && cacheManager.getCache("destinations") != null) {
                        cacheManager.getCache("destinations").put(id, enriched);
                    }
                }
            } catch (Exception ignored) {}
        }, enrichmentExecutor);

        return DestinationDetailsResponse.builder()
                .destination(destResponse)
                .weather(weather)
                .wikipedia(wikipedia)
                .travelGuide(travelGuide)
                .travelerExperiences(travelerExperiences)
                .build();
    }

    public WeatherResponse getDestinationWeather(Long id) {
        Destination destination = destinationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Destination not found with id: " + id));
        try {
            return weatherService.getCurrentWeather(destination.getLatitude(), destination.getLongitude());
        } catch (Exception e) {
            return WeatherResponse.builder().available(false).attribution(WeatherService.OPEN_METEO_ATTRIBUTION).build();
        }
    }

    public TravelGuideResponse getDestinationGuide(Long id) {
        Destination destination = destinationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Destination not found with id: " + id));
        try {
            return travelGuideService.getTravelGuide(
                    destination.getName(), destination.getCountry(),
                    destination.getLatitude(), destination.getLongitude());
        } catch (Exception e) {
            return TravelGuideResponse.builder().available(false).attribution(TravelGuideService.DEFAULT_ATTRIBUTION).build();
        }
    }

    public WikipediaResponse getDestinationWiki(Long id) {
        Destination destination = destinationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Destination not found with id: " + id));
        try {
            return wikipediaService.getWikipediaSummary(destination.getName());
        } catch (Exception e) {
            return WikipediaResponse.builder().available(false).attribution(WikipediaService.WIKIPEDIA_ATTRIBUTION).build();
        }
    }

    @Cacheable(value = "destination-image", key = "#id", sync = true)
    public Map<String, String> getDestinationImageOnly(Long id) {
        Destination destination = destinationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Destination not found with id: " + id));

        String imageUrl = destination.getImageUrl();
        if (imageUrl == null || imageUrl.trim().isEmpty()) {
            try {
                WikipediaResponse wiki = wikipediaService.getWikipediaSummary(destination.getName());
                if (wiki != null && wiki.getImageUrl() != null && !wiki.getImageUrl().trim().isEmpty()) {
                    imageUrl = wiki.getImageUrl();
                }
            } catch (Exception ignored) {
            }
        }

        Map<String, String> result = new HashMap<>();
        result.put("imageUrl", imageUrl != null ? imageUrl : "");
        return result;
    }

    public double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth radius in km
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double clampedA = Math.min(1.0, Math.max(0.0, a));
        double c = 2 * Math.atan2(Math.sqrt(clampedA), Math.sqrt(1 - clampedA));
        return Math.round(R * c * 10.0) / 10.0;
    }

    @Transactional
    @CacheEvict(value = {"destinations", "destination-image", "destinations-list"}, allEntries = true)
    public DestinationResponse updateDestination(Long id, DestinationRequest request) {
        Destination destination = destinationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Destination not found with id: " + id));

        String name = request.getName() != null ? request.getName().trim() : "";
        String state = request.getState() != null ? request.getState().trim() : "";
        String country = request.getCountry() != null ? request.getCountry().trim() : "";

        Optional<Destination> existingOpt = destinationRepository
                .findByNameIgnoreCaseAndStateIgnoreCaseAndCountryIgnoreCase(name, state, country)
                .or(() -> destinationRepository.findByNameIgnoreCase(name));

        if (existingOpt.isPresent() && !existingOpt.get().getId().equals(id)) {
            throw new RuntimeException("Destination with this name already exists");
        }

        destination.setName(name);
        destination.setState(state);
        destination.setCountry(country);
        destination.setDescription(request.getDescription() != null ? request.getDescription().trim() : "");
        destination.setCategory(request.getCategory() != null ? request.getCategory().trim() : "General");
        destination.setImageUrl(request.getImageUrl() != null ? request.getImageUrl().trim() : null);
        destination.setBestSeason(request.getBestSeason() != null ? request.getBestSeason().trim() : null);
        destination.setEstimatedBudget(request.getEstimatedBudget() != null ? request.getEstimatedBudget() : 0.0);
        destination.setRecommendedDays(request.getRecommendedDays() != null ? request.getRecommendedDays() : 3);
        destination.setLatitude(request.getLatitude());
        destination.setLongitude(request.getLongitude());
        destination.setRating(request.getRating() != null ? request.getRating() : 4.0);

        Destination updated = destinationRepository.save(destination);
        return mapToResponse(updated);
    }

    @Transactional
    @CacheEvict(value = {"destinations", "destination-image", "destinations-list"}, allEntries = true)
    public void deleteDestination(Long id) {
        destinationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Destination not found with id: " + id));
        favoriteDestinationRepository.deleteByDestinationId(id);
        travelMemoryRepository.nullifyDestinationReferences(id);
        destinationRepository.deleteById(id);
    }

    public DestinationResponse mapToResponse(Destination destination) {
        DestinationResponse response = new DestinationResponse();
        response.setId(destination.getId());
        response.setName(destination.getName());
        response.setState(destination.getState());
        response.setCountry(destination.getCountry());
        response.setDescription(destination.getDescription());
        response.setCategory(destination.getCategory());
        response.setImageUrl(destination.getImageUrl());
        response.setBestSeason(destination.getBestSeason());
        response.setEstimatedBudget(destination.getEstimatedBudget());
        response.setRecommendedDays(destination.getRecommendedDays());
        response.setLatitude(destination.getLatitude());
        response.setLongitude(destination.getLongitude());
        response.setRating(destination.getRating());
        response.setPopular(destination.getPopular() != null ? destination.getPopular() : false);
        return response;
    }
}