package com.tripnest.service;

import com.tripnest.dto.ActivityResponse;
import com.tripnest.dto.ItineraryRequest;
import com.tripnest.dto.ItineraryResponse;
import com.tripnest.entity.Activity;
import com.tripnest.entity.Itinerary;
import com.tripnest.entity.Trip;
import com.tripnest.repository.ActivityRepository;
import com.tripnest.repository.ItineraryRepository;
import com.tripnest.repository.TripRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ItineraryService {

    @Autowired
    private ItineraryRepository itineraryRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private TripShareService tripShareService;

    public ItineraryResponse createItinerary(ItineraryRequest request, Long userId) {
        Trip trip = tripRepository.findById(request.getTripId())
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        boolean isOwner = trip.getUser().getId().equals(userId);
        boolean hasEditAccess = tripShareService.hasEditAccess(request.getTripId(), userId);
        if (!isOwner && !hasEditAccess) {
            throw new RuntimeException("Unauthorized");
        }

        if (request.getDate().isBefore(trip.getStartDate()) || request.getDate().isAfter(trip.getEndDate())) {
            throw new IllegalArgumentException("Itinerary date must fall within the trip duration.");
        }

        Itinerary itinerary = new Itinerary();
        itinerary.setDate(request.getDate());
        itinerary.setNotes(request.getNotes());
        itinerary.setTrip(trip);

        Itinerary saved = itineraryRepository.save(itinerary);
        return mapToResponse(saved);
    }

    public List<ItineraryResponse> getTripItineraries(Long tripId, Long userId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        boolean isOwner = trip.getUser().getId().equals(userId);
        boolean hasAccess = tripShareService.hasAccess(tripId, userId);
        if (!isOwner && !hasAccess) {
            throw new RuntimeException("Unauthorized");
        }

        return itineraryRepository.findByTripIdOrderByDateAsc(tripId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ItineraryResponse updateItinerary(Long id, ItineraryRequest request, Long userId) {
        Itinerary itinerary = itineraryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Itinerary not found"));

        Trip trip = itinerary.getTrip();
        boolean isOwner = trip.getUser().getId().equals(userId);
        boolean hasEditAccess = tripShareService.hasEditAccess(trip.getId(), userId);
        if (!isOwner && !hasEditAccess) {
            throw new RuntimeException("Unauthorized");
        }

        if (request.getDate().isBefore(trip.getStartDate()) || request.getDate().isAfter(trip.getEndDate())) {
            throw new IllegalArgumentException("Itinerary date must fall within the trip duration.");
        }

        itinerary.setDate(request.getDate());
        itinerary.setNotes(request.getNotes());

        Itinerary updated = itineraryRepository.save(itinerary);
        return mapToResponse(updated);
    }

    public void deleteItinerary(Long id, Long userId) {
        Itinerary itinerary = itineraryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Itinerary not found"));

        Trip trip = itinerary.getTrip();
        boolean isOwner = trip.getUser().getId().equals(userId);
        boolean hasEditAccess = tripShareService.hasEditAccess(trip.getId(), userId);
        if (!isOwner && !hasEditAccess) {
            throw new RuntimeException("Unauthorized");
        }

        itineraryRepository.delete(itinerary);
    }

    private ItineraryResponse mapToResponse(Itinerary itinerary) {
        ItineraryResponse response = new ItineraryResponse();
        response.setId(itinerary.getId());
        response.setDate(itinerary.getDate());
        response.setNotes(itinerary.getNotes());
        response.setTripId(itinerary.getTrip().getId());
        response.setTripTitle(itinerary.getTrip().getTitle());
        response.setCreatedAt(itinerary.getCreatedAt());
        response.setUpdatedAt(itinerary.getUpdatedAt());

        List<ActivityResponse> activities = activityRepository
                .findByItineraryIdOrderByStartTimeAsc(itinerary.getId())
                .stream()
                .map(this::mapActivityToResponse)
                .collect(Collectors.toList());
        response.setActivities(activities);

        return response;
    }

    private ActivityResponse mapActivityToResponse(Activity activity) {
        ActivityResponse response = new ActivityResponse();
        response.setId(activity.getId());
        response.setTitle(activity.getTitle());
        response.setDescription(activity.getDescription());
        response.setStartTime(activity.getStartTime());
        response.setEndTime(activity.getEndTime());
        response.setLocation(activity.getLocation());
        response.setType(activity.getType() != null ? activity.getType().name() : null);
        response.setCost(activity.getCost());
        response.setItineraryId(activity.getItinerary().getId());
        response.setCreatedAt(activity.getCreatedAt());
        response.setUpdatedAt(activity.getUpdatedAt());
        return response;
    }
}