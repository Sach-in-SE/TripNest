package com.tripnest.service;

import com.tripnest.dto.ActivityRequest;
import com.tripnest.dto.ActivityResponse;
import com.tripnest.dto.ExpenseRequest;
import com.tripnest.entity.Activity;
import com.tripnest.entity.ActivityType;
import com.tripnest.entity.ExpenseCategory;
import com.tripnest.entity.Itinerary;
import com.tripnest.entity.Trip;
import com.tripnest.repository.ActivityRepository;
import com.tripnest.repository.ExpenseRepository;
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

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private ExpenseService expenseService;

    @Autowired
    private TripShareService tripShareService;

    public ActivityResponse createActivity(ActivityRequest request, Long userId) {
        Itinerary itinerary = itineraryRepository.findById(request.getItineraryId())
                .orElseThrow(() -> new RuntimeException("Itinerary not found"));

        Trip trip = itinerary.getTrip();
        boolean isOwner = trip.getUser().getId().equals(userId);
        boolean hasEditAccess = tripShareService.hasEditAccess(trip.getId(), userId);
        if (!isOwner && !hasEditAccess) {
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

        if (request.getCost() != null && request.getCost() > 0) {
            ExpenseCategory expenseCategory = mapActivityTypeToExpenseCategory(activity.getType());
            ExpenseRequest expenseRequest = new ExpenseRequest();
            expenseRequest.setTitle(activity.getTitle());
            expenseRequest.setAmount(activity.getCost());
            expenseRequest.setCategory(expenseCategory.name());
            expenseRequest.setDescription("Auto-added from activity: " + activity.getTitle());
            expenseRequest.setDate(itinerary.getDate());
            expenseRequest.setTripId(trip.getId());

            var expenseResponse = expenseService.createExpense(expenseRequest, userId);
            saved.setLinkedExpenseId(expenseResponse.getId());
            activityRepository.save(saved);
        }

        return mapToResponse(saved);
    }

    public List<ActivityResponse> getItineraryActivities(Long itineraryId, Long userId) {
        Itinerary itinerary = itineraryRepository.findById(itineraryId)
                .orElseThrow(() -> new RuntimeException("Itinerary not found"));

        Trip trip = itinerary.getTrip();
        boolean isOwner = trip.getUser().getId().equals(userId);
        boolean hasAccess = tripShareService.hasAccess(trip.getId(), userId);
        if (!isOwner && !hasAccess) {
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

        Trip trip = activity.getItinerary().getTrip();
        boolean isOwner = trip.getUser().getId().equals(userId);
        boolean hasEditAccess = tripShareService.hasEditAccess(trip.getId(), userId);
        if (!isOwner && !hasEditAccess) {
            throw new RuntimeException("Unauthorized");
        }

        Double oldCost = activity.getCost();

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

        if (request.getCost() != null && request.getCost() > 0) {
            if (activity.getLinkedExpenseId() != null) {
                expenseRepository.findById(activity.getLinkedExpenseId()).ifPresent(expense -> {
                    expense.setAmount(request.getCost());
                    expenseRepository.save(expense);
                });
            } else if (oldCost == null || oldCost == 0) {
                ExpenseCategory expenseCategory = mapActivityTypeToExpenseCategory(activity.getType());
                ExpenseRequest expenseRequest = new ExpenseRequest();
                expenseRequest.setTitle(activity.getTitle());
                expenseRequest.setAmount(activity.getCost());
                expenseRequest.setCategory(expenseCategory.name());
                expenseRequest.setDescription("Auto-added from activity: " + activity.getTitle());
                expenseRequest.setDate(activity.getItinerary().getDate());
                expenseRequest.setTripId(activity.getItinerary().getTrip().getId());

                var expenseResponse = expenseService.createExpense(expenseRequest, userId);
                updated.setLinkedExpenseId(expenseResponse.getId());
                activityRepository.save(updated);
            }
        }

        return mapToResponse(updated);
    }

    public void deleteActivity(Long id, Long userId) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Activity not found"));

        Trip trip = activity.getItinerary().getTrip();
        boolean isOwner = trip.getUser().getId().equals(userId);
        boolean hasEditAccess = tripShareService.hasEditAccess(trip.getId(), userId);
        if (!isOwner && !hasEditAccess) {
            throw new RuntimeException("Unauthorized");
        }

        if (activity.getLinkedExpenseId() != null) {
            expenseRepository.findById(activity.getLinkedExpenseId()).ifPresent(expense -> {
                expenseRepository.delete(expense);
            });
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

    private ExpenseCategory mapActivityTypeToExpenseCategory(ActivityType activityType) {
        if (activityType == null) {
            return ExpenseCategory.MISCELLANEOUS;
        }
        switch (activityType) {
            case SIGHTSEEING:
            case ADVENTURE:
                return ExpenseCategory.ENTERTAINMENT;
            case TRANSPORTATION:
                return ExpenseCategory.TRANSPORTATION;
            case ACCOMMODATION:
                return ExpenseCategory.HOTEL;
            case DINING:
                return ExpenseCategory.FOOD;
            case SHOPPING:
                return ExpenseCategory.SHOPPING;
            case OTHER:
            default:
                return ExpenseCategory.MISCELLANEOUS;
        }
    }
}