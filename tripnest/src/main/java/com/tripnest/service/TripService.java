package com.tripnest.service;

import com.tripnest.dto.TripRequest;
import com.tripnest.dto.TripResponse;
import com.tripnest.entity.Trip;
import com.tripnest.entity.TripStatus;
import com.tripnest.entity.User;
import com.tripnest.repository.TripRepository;
import com.tripnest.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;


@Service
public class TripService {

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TripShareService tripShareService;

    public TripResponse createTrip(TripRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Trip trip = new Trip();
        trip.setTitle(request.getTitle());
        trip.setDescription(request.getDescription());
        trip.setDestination(request.getDestination());
        trip.setStartDate(request.getStartDate());
        trip.setEndDate(request.getEndDate());
        trip.setNumberOfTravelers(request.getNumberOfTravelers());
        trip.setBudget(request.getBudget());
        trip.setUser(user);

        if (request.getStatus() != null) {
            trip.setStatus(TripStatus.valueOf(request.getStatus()));
        }

        Trip saved = tripRepository.save(trip);
        return mapToResponse(saved);
    }

    public List<TripResponse> getUserTrips(Long userId) {
        return tripRepository.findByUserId(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public TripResponse getTripById(Long tripId, Long userId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));
        boolean isOwner = trip.getUser().getId().equals(userId);
        boolean hasSharedAccess = tripShareService.hasAccess(tripId, userId);
        if (!isOwner && !hasSharedAccess) {
            throw new RuntimeException("Unauthorized");
        }
        return mapToResponse(trip);
    }

    public TripResponse updateTrip(Long tripId, TripRequest request, Long userId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));
        boolean isOwner = trip.getUser().getId().equals(userId);
        boolean hasEditAccess = tripShareService.hasEditAccess(tripId, userId);
        if (!isOwner && !hasEditAccess) {
            throw new RuntimeException("Unauthorized");
        }

        trip.setTitle(request.getTitle());
        trip.setDescription(request.getDescription());
        trip.setDestination(request.getDestination());
        trip.setStartDate(request.getStartDate());
        trip.setEndDate(request.getEndDate());
        trip.setNumberOfTravelers(request.getNumberOfTravelers());
        trip.setBudget(request.getBudget());

        if (request.getStatus() != null) {
            trip.setStatus(TripStatus.valueOf(request.getStatus()));
        }

        Trip updated = tripRepository.save(trip);
        return mapToResponse(updated);
    }
    
    public void deleteTrip(Long tripId, Long userId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));
        if (!trip.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        tripRepository.delete(trip);
    }

    private TripResponse mapToResponse(Trip trip) {
        TripResponse response = new TripResponse();
        response.setId(trip.getId());
        response.setTitle(trip.getTitle());
        response.setDescription(trip.getDescription());
        response.setDestination(trip.getDestination());
        response.setStartDate(trip.getStartDate());
        response.setEndDate(trip.getEndDate());
        response.setNumberOfTravelers(trip.getNumberOfTravelers());
        response.setBudget(trip.getBudget());
        response.setStatus(trip.getStatus().name());
        response.setUserId(trip.getUser().getId());
        response.setUsername(trip.getUser().getUsername());
        response.setCreatedAt(trip.getCreatedAt());
        response.setUpdatedAt(trip.getUpdatedAt());
        return response;
    }
}