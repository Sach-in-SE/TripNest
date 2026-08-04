package com.tripnest.service;

import com.tripnest.dto.DestinationRequest;
import com.tripnest.dto.DestinationResponse;
import com.tripnest.entity.Destination;
import com.tripnest.repository.DestinationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DestinationService {

    @Autowired
    private DestinationRepository destinationRepository;

    public DestinationResponse createDestination(DestinationRequest request) {
        if (destinationRepository.existsByName(request.getName())) {
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
        switch (sortBy) {
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
        return destinations.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public DestinationResponse getDestinationById(Long id) {
        Destination destination = destinationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Destination not found"));
        return mapToResponse(destination);
    }

    public DestinationResponse updateDestination(Long id, DestinationRequest request) {
        Destination destination = destinationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Destination not found"));

        if (!destination.getName().equals(request.getName()) && 
            destinationRepository.existsByName(request.getName())) {
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
                .orElseThrow(() -> new RuntimeException("Destination not found"));
        destinationRepository.deleteById(id);
    }

    private DestinationResponse mapToResponse(Destination destination) {
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
        return response;
    }
}