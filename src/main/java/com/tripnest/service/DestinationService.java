package com.tripnest.service;

import com.tripnest.dto.DestinationDetailsResponse;
import com.tripnest.dto.DestinationRequest;
import com.tripnest.dto.DestinationResponse;
import com.tripnest.dto.WeatherResponse;
import com.tripnest.dto.WikipediaResponse;
import com.tripnest.entity.Destination;
import com.tripnest.exception.ResourceNotFoundException;
import com.tripnest.repository.DestinationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DestinationService {

    @Autowired
    private DestinationRepository destinationRepository;

    @Autowired
    private WeatherService weatherService;

    @Autowired
    private WikipediaService wikipediaService;

    public DestinationResponse createDestination(DestinationRequest request) {
        String name = request.getName() != null ? request.getName().trim() : "";
        String state = request.getState() != null ? request.getState().trim() : "";
        String country = request.getCountry() != null ? request.getCountry().trim() : "";

        if (destinationRepository.existsByNameIgnoreCaseAndStateIgnoreCaseAndCountryIgnoreCase(name, state, country)
                || destinationRepository.existsByName(name)) {
            throw new RuntimeException("Destination with this name already exists");
        }

        Destination destination = new Destination();
        destination.setName(request.getName());
        destination.setState(request.getState());
        destination.setCountry(request.getCountry());
        destination.setDescription(request.getDescription());
        destination.setCategory(request.getCategory());
        destination.setImageUrl(request.getImageUrl());
        destination.setBestSeason(request.getBestSeason());
        destination.setEstimatedBudget(request.getEstimatedBudget());
        destination.setRecommendedDays(request.getRecommendedDays());
        destination.setLatitude(request.getLatitude());
        destination.setLongitude(request.getLongitude());
        destination.setRating(request.getRating() != null ? request.getRating() : 4.0);

        Destination saved = destinationRepository.save(destination);
        return mapToResponse(saved);
    }

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

    public List<DestinationResponse> filterByCategory(String category) {
        return destinationRepository.findByCategoryIgnoreCase(category)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

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

    public DestinationDetailsResponse getDestinationDetails(Long id) {
        Destination destination = destinationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Destination not found with id: " + id));

        DestinationResponse destResponse = mapToResponse(destination);

        WeatherResponse weather = weatherService.getCurrentWeather(
                destination.getLatitude(), destination.getLongitude());

        List<DestinationResponse> nearby = getNearbyDestinations(id, 4);

        WikipediaResponse wikipedia = wikipediaService.getWikipediaSummary(
                destination.getName());

        return DestinationDetailsResponse.builder()
                .destination(destResponse)
                .weather(weather)
                .nearbyDestinations(nearby)
                .wikipedia(wikipedia)
                .build();
    }

    public List<DestinationResponse> getNearbyDestinations(Long destinationId, int limit) {
        Destination current = destinationRepository.findById(destinationId)
                .orElseThrow(() -> new ResourceNotFoundException("Destination not found with id: " + destinationId));

        if (current.getLatitude() == null || current.getLongitude() == null) {
            return Collections.emptyList();
        }

        double curLat = current.getLatitude();
        double curLon = current.getLongitude();

        return destinationRepository.findAll().stream()
                .filter(d -> !d.getId().equals(destinationId))
                .filter(d -> d.getLatitude() != null && d.getLongitude() != null)
                .map(d -> {
                    DestinationResponse resp = mapToResponse(d);
                    double dist = calculateDistance(curLat, curLon, d.getLatitude(), d.getLongitude());
                    resp.setDistanceKm(dist);
                    return resp;
                })
                .sorted(Comparator.comparingDouble(DestinationResponse::getDistanceKm))
                .limit(limit)
                .collect(Collectors.toList());
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

        destination.setName(request.getName());
        destination.setState(request.getState());
        destination.setCountry(request.getCountry());
        destination.setDescription(request.getDescription());
        destination.setCategory(request.getCategory());
        destination.setImageUrl(request.getImageUrl());
        destination.setBestSeason(request.getBestSeason());
        destination.setEstimatedBudget(request.getEstimatedBudget());
        destination.setRecommendedDays(request.getRecommendedDays());
        destination.setLatitude(request.getLatitude());
        destination.setLongitude(request.getLongitude());
        destination.setRating(request.getRating());

        Destination updated = destinationRepository.save(destination);
        return mapToResponse(updated);
    }

    public void deleteDestination(Long id) {
        destinationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Destination not found with id: " + id));
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