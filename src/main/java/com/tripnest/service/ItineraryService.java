package com.tripnest.service;

import com.tripnest.dto.ActivityResponse;
import com.tripnest.dto.ItineraryRequest;
import com.tripnest.dto.ItineraryResponse;
import com.tripnest.entity.Activity;
import com.tripnest.entity.Expense;
import com.tripnest.entity.Itinerary;
import com.tripnest.entity.Trip;
import com.tripnest.entity.User;
import com.tripnest.repository.ActivityRepository;
import com.tripnest.repository.ExpenseRepository;
import com.tripnest.repository.ItineraryRepository;
import com.tripnest.repository.TripRepository;
import com.tripnest.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.tripnest.exception.ResourceNotFoundException;
import com.tripnest.exception.UnauthorizedAccessException;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ItineraryService {

    @Autowired
    private ItineraryRepository itineraryRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TripShareService tripShareService;

    @Autowired
    private TripTimelineValidator tripTimelineValidator;

    @Autowired
    private TravelUpdateNotificationService travelUpdateNotificationService;

    @Transactional
    public ItineraryResponse createItinerary(ItineraryRequest request, Long userId) {
        tripTimelineValidator.validateDateWithinTripTimeline(request.getTripId(), request.getDate(), userId);

        Trip trip = tripTimelineValidator.getTripForValidation(request.getTripId());
        boolean isOwner = trip.getUser().getId().equals(userId);
        boolean hasEditAccess = tripShareService.hasEditAccess(trip.getId(), userId);
        if (!isOwner && !hasEditAccess) {
            throw new UnauthorizedAccessException("Unauthorized");
        }

        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Itinerary itinerary = new Itinerary();
        itinerary.setDate(request.getDate());
        itinerary.setNotes(request.getNotes());
        itinerary.setTrip(trip);
        itinerary.setUser(creator);

        Itinerary saved = itineraryRepository.save(itinerary);
        
        // Notify trip members about itinerary update
        travelUpdateNotificationService.notifyItineraryUpdated(trip.getId(), userId);
        
        return mapToResponse(saved);
    }

    public List<ItineraryResponse> getTripItineraries(Long tripId, Long userId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip", "id", tripId));

        boolean isOwner = trip.getUser().getId().equals(userId);
        boolean hasAccess = tripShareService.hasAccess(tripId, userId);
        if (!isOwner && !hasAccess) {
            throw new UnauthorizedAccessException("Unauthorized");
        }

        List<Itinerary> itineraries = itineraryRepository.findByTripIdWithTripAndUserOrderByDateAsc(tripId);
        if (itineraries.isEmpty()) {
            itineraries = itineraryRepository.findByTripIdOrderByDateAsc(tripId);
        }
        if (itineraries.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> itineraryIds = itineraries.stream().map(Itinerary::getId).collect(Collectors.toList());
        List<Activity> activities = activityRepository.findByItineraryIdInWithUserOrderByStartTimeAsc(itineraryIds);
        Map<Long, List<Activity>> activitiesByItinerary = activities.stream()
                .collect(Collectors.groupingBy(a -> a.getItinerary().getId()));

        return itineraries.stream()
                .map(itin -> mapToResponseWithActivities(itin, activitiesByItinerary.getOrDefault(itin.getId(), Collections.emptyList())))
                .collect(Collectors.toList());
    }

    @Transactional
    public ItineraryResponse updateItinerary(Long id, ItineraryRequest request, Long userId) {
        Itinerary itinerary = itineraryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Itinerary", "id", id));

        Trip trip = itinerary.getTrip();
        boolean isOwner = trip.getUser().getId().equals(userId);
        boolean hasEditAccess = tripShareService.hasEditAccess(trip.getId(), userId);
        if (!isOwner && !hasEditAccess) {
            throw new UnauthorizedAccessException("Unauthorized");
        }

        tripTimelineValidator.validateDateWithinTripTimeline(trip.getId(), request.getDate(), userId);

        itinerary.setDate(request.getDate());
        itinerary.setNotes(request.getNotes());

        Itinerary updated = itineraryRepository.save(itinerary);
        
        // Notify trip members about itinerary update
        travelUpdateNotificationService.notifyItineraryUpdated(trip.getId(), userId);
        
        return mapToResponse(updated);
    }

    @Transactional
    public void deleteItinerary(Long id, Long userId) {
        Itinerary itinerary = itineraryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Itinerary", "id", id));

        Trip trip = itinerary.getTrip();
        boolean isOwner = trip.getUser().getId().equals(userId);
        boolean hasEditAccess = tripShareService.hasEditAccess(trip.getId(), userId);
        if (!isOwner && !hasEditAccess) {
            throw new UnauthorizedAccessException("Unauthorized");
        }

        // 1. Delete linked expenses from activities
        List<Activity> activities = activityRepository.findByItineraryIdOrderByStartTimeAsc(id);
        for (Activity activity : activities) {
            if (activity.getLinkedExpenseId() != null) {
                expenseRepository.findById(activity.getLinkedExpenseId()).ifPresent(expense -> {
                    expenseRepository.delete(expense);
                });
            }
        }

        // 2. Delete activities
        activityRepository.deleteAll(activities);

        // 3. Delete itinerary
        itineraryRepository.delete(itinerary);
    }

    private ItineraryResponse mapToResponse(Itinerary itinerary) {
        List<Activity> activities = activityRepository.findByItineraryIdOrderByStartTimeAsc(itinerary.getId());
        return mapToResponseWithActivities(itinerary, activities);
    }

    private ItineraryResponse mapToResponseWithActivities(Itinerary itinerary, List<Activity> activities) {
        ItineraryResponse response = new ItineraryResponse();
        response.setId(itinerary.getId());
        response.setDate(itinerary.getDate());
        response.setNotes(itinerary.getNotes());
        response.setTripId(itinerary.getTrip().getId());
        response.setTripTitle(itinerary.getTrip().getTitle());
        response.setUserId(itinerary.getUser() != null ? itinerary.getUser().getId() : null);
        response.setUsername(itinerary.getUser() != null ? itinerary.getUser().getUsername() : null);
        response.setCreatedAt(itinerary.getCreatedAt());
        response.setUpdatedAt(itinerary.getUpdatedAt());

        List<ActivityResponse> activityResponses = activities.stream()
                .map(this::mapActivityToResponse)
                .collect(Collectors.toList());
        response.setActivities(activityResponses);

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
        response.setReminder(activity.getReminder() != null ? activity.getReminder().name() : null);
        response.setUserId(activity.getUser() != null ? activity.getUser().getId() : null);
        response.setUsername(activity.getUser() != null ? activity.getUser().getUsername() : null);
        response.setCreatedAt(activity.getCreatedAt());
        response.setUpdatedAt(activity.getUpdatedAt());
        return response;
    }
}