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
        Destination destination = new Destination();
        destination.setName(request.getName());
        destination.setCountry(request.getCountry());
        destination.setCity(request.getCity());
        destination.setDescription(request.getDescription());
        destination.setImageUrl(request.getImageUrl());
        destination.setClimate(request.getClimate());
        destination.setBestTimeToVisit(request.getBestTimeToVisit());
        destination.setAverageCost(request.getAverageCost());
        destination.setPopular(request.isPopular());

        Destination saved = destinationRepository.save(destination);
        return mapToResponse(saved);
    }

    public List<DestinationResponse> getAllDestinations() {
        return destinationRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<DestinationResponse> getPopularDestinations() {
        return destinationRepository.findByPopularTrue()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<DestinationResponse> searchDestinations(String name) {
        return destinationRepository.findByNameContainingIgnoreCase(name)
                .stream()
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

        destination.setName(request.getName());
        destination.setCountry(request.getCountry());
        destination.setCity(request.getCity());
        destination.setDescription(request.getDescription());
        destination.setImageUrl(request.getImageUrl());
        destination.setClimate(request.getClimate());
        destination.setBestTimeToVisit(request.getBestTimeToVisit());
        destination.setAverageCost(request.getAverageCost());
        destination.setPopular(request.isPopular());

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
        response.setCountry(destination.getCountry());
        response.setCity(destination.getCity());
        response.setDescription(destination.getDescription());
        response.setImageUrl(destination.getImageUrl());
        response.setClimate(destination.getClimate());
        response.setBestTimeToVisit(destination.getBestTimeToVisit());
        response.setAverageCost(destination.getAverageCost());
        response.setPopular(destination.isPopular());
        return response;
    }
}