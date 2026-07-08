package com.tripnest.service;

import com.tripnest.dto.ActivityRequest;
import com.tripnest.dto.ActivityResponse;
import com.tripnest.entity.Activity;
import com.tripnest.entity.ActivityType;
import com.tripnest.entity.Itinerary;
import com.tripnest.repository.ActivityRepository;
import com.tripnest.repository.ItineraryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ActivityService {

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private ItineraryRepository itineraryRepository;

    public ActivityResponse createActivity(ActivityRequest request, Long userId) {
        Itinerary itinerary = itineraryRepository.findById(request.getItineraryId())
                .orElseThrow(() -> new RuntimeException("Itinerary not found"));

        if (!itinerary.getTrip().getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        Activity activity = new Activity();
        activity.setTitle(request.getTitle());
        activity.setDescription(request.getDescription());
        activity.setStartTime(request.getStartTime());
        activity.setEndTime(request.getEndTime());
        activity.setLocation(request.getLocation());
        activity.setCost(request.getCost());
        activity.setItinerary(itinerary);

        if (request.getType() != null) {
            activity.setType(ActivityType.valueOf(request.getType()));
        }

        Activity saved = activityRepository.save(activity);
        return mapToResponse(saved);
    }

    public List<ActivityResponse> getItineraryActivities(Long itineraryId, Long userId) {
        Itinerary itinerary = itineraryRepository.findById(itineraryId)
                .orElseThrow(() -> new RuntimeException("Itinerary not found"));

        if (!itinerary.getTrip().getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        return activityRepository.findByItineraryIdOrderByStartTimeAsc(itineraryId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ActivityResponse updateActivity(Long id, ActivityRequest request, Long userId) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Activity not found"));

        if (!activity.getItinerary().getTrip().getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        activity.setTitle(request.getTitle());
        activity.setDescription(request.getDescription());
        activity.setStartTime(request.getStartTime());
        activity.setEndTime(request.getEndTime());
        activity.setLocation(request.getLocation());
        activity.setCost(request.getCost());

        if (request.getType() != null) {
            activity.setType(ActivityType.valueOf(request.getType()));
        }

        Activity updated = activityRepository.save(activity);
        return mapToResponse(updated);
    }

    public void deleteActivity(Long id, Long userId) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Activity not found"));

        if (!activity.getItinerary().getTrip().getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        activityRepository.delete(activity);
    }

    private ActivityResponse mapToResponse(Activity activity) {
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