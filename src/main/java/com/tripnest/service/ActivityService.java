package com.tripnest.service;

import com.tripnest.dto.ActivityRequest;
import com.tripnest.dto.ActivityResponse;
import com.tripnest.dto.ExpenseRequest;
import com.tripnest.entity.Activity;
import com.tripnest.entity.ActivityReminder;
import com.tripnest.entity.ActivityType;
import com.tripnest.entity.ExpenseCategory;
import com.tripnest.entity.Itinerary;
import com.tripnest.entity.Trip;
import com.tripnest.entity.User;
import com.tripnest.repository.ActivityRepository;
import com.tripnest.repository.ExpenseRepository;
import com.tripnest.repository.ExpenseSplitRepository;
import com.tripnest.repository.ItineraryRepository;
import com.tripnest.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import com.tripnest.exception.ResourceNotFoundException;
import com.tripnest.exception.UnauthorizedAccessException;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ActivityService {

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private ItineraryRepository itineraryRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired(required = false)
    private ExpenseSplitRepository expenseSplitRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ExpenseService expenseService;

    @Autowired
    private TripTimelineValidator tripTimelineValidator;

    @Autowired
    private TripShareService tripShareService;

    @Autowired
    private TravelUpdateNotificationService travelUpdateNotificationService;

    @Transactional
    public ActivityResponse createActivity(ActivityRequest request, Long userId) {
        Itinerary itinerary = itineraryRepository.findById(request.getItineraryId())
                .orElseThrow(() -> new ResourceNotFoundException("Itinerary", "id", request.getItineraryId()));

        Trip trip = itinerary.getTrip();
        
        // Validate activity date is within trip timeline
        tripTimelineValidator.validateDateWithinTripTimeline(trip.getId(), itinerary.getDate(), userId);
        
        boolean isOwner = trip.getUser().getId().equals(userId);
        boolean hasEditAccess = tripShareService.hasEditAccess(trip.getId(), userId);
        if (!isOwner && !hasEditAccess) {
            throw new UnauthorizedAccessException("Unauthorized");
        }

        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Activity activity = new Activity();
        activity.setTitle(request.getTitle());
        activity.setDescription(request.getDescription());
        activity.setStartTime(request.getStartTime());
        activity.setEndTime(request.getEndTime());
        activity.setLocation(request.getLocation());
        activity.setCost(request.getCost());
        activity.setItinerary(itinerary);
        activity.setUser(creator);

        if (request.getType() != null) {
            activity.setType(ActivityType.valueOf(request.getType()));
        }

        if (request.getReminder() != null) {
            activity.setReminder(ActivityReminder.valueOf(request.getReminder()));
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

        // Notify trip members about activity addition
        travelUpdateNotificationService.notifyActivityAdded(trip.getId(), activity.getTitle(), userId);

        return mapToResponse(saved);
    }

    public List<ActivityResponse> getItineraryActivities(Long itineraryId, Long userId) {
        Itinerary itinerary = itineraryRepository.findById(itineraryId)
                .orElseThrow(() -> new ResourceNotFoundException("Itinerary", "id", itineraryId));

        Trip trip = itinerary.getTrip();
        boolean isOwner = trip.getUser().getId().equals(userId);
        boolean hasAccess = tripShareService.hasAccess(trip.getId(), userId);
        if (!isOwner && !hasAccess) {
            throw new UnauthorizedAccessException("Unauthorized");
        }

        return activityRepository.findByItineraryIdOrderByStartTimeAsc(itineraryId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ActivityResponse updateActivity(Long id, ActivityRequest request, Long userId) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Activity", "id", id));

        Trip trip = activity.getItinerary().getTrip();
        
        // Validate activity date is within trip timeline
        tripTimelineValidator.validateDateWithinTripTimeline(trip.getId(), activity.getItinerary().getDate(), userId);
        
        boolean isOwner = trip.getUser().getId().equals(userId);
        boolean hasEditAccess = tripShareService.hasEditAccess(trip.getId(), userId);
        if (!isOwner && !hasEditAccess) {
            throw new UnauthorizedAccessException("Unauthorized");
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

        if (request.getReminder() != null) {
            activity.setReminder(ActivityReminder.valueOf(request.getReminder()));
            // Reset reminderSent flag when reminder configuration changes
            activity.setReminderSent(false);
        }

        Activity updated = activityRepository.save(activity);

        Double newCost = request.getCost();
        if (updated.getLinkedExpenseId() != null) {
            if (newCost == null || newCost <= 0) {
                deleteLinkedExpense(updated.getLinkedExpenseId());
                updated.setLinkedExpenseId(null);
                updated = activityRepository.save(updated);
            } else {
                Long linkedId = updated.getLinkedExpenseId();
                var expenseOpt = expenseRepository.findById(linkedId);
                if (expenseOpt.isPresent()) {
                    var expense = expenseOpt.get();
                    expense.setAmount(newCost);
                    expense.setTitle(updated.getTitle());
                    if (updated.getType() != null) {
                        expense.setCategory(mapActivityTypeToExpenseCategory(updated.getType()));
                    }
                    expenseRepository.save(expense);
                } else {
                    ExpenseCategory expenseCategory = mapActivityTypeToExpenseCategory(updated.getType());
                    ExpenseRequest expenseRequest = new ExpenseRequest();
                    expenseRequest.setTitle(updated.getTitle());
                    expenseRequest.setAmount(newCost);
                    expenseRequest.setCategory(expenseCategory.name());
                    expenseRequest.setDescription("Auto-added from activity: " + updated.getTitle());
                    expenseRequest.setDate(updated.getItinerary().getDate());
                    expenseRequest.setTripId(updated.getItinerary().getTrip().getId());

                    var expenseResponse = expenseService.createExpense(expenseRequest, userId);
                    updated.setLinkedExpenseId(expenseResponse.getId());
                    updated = activityRepository.save(updated);
                }
            }
        } else if (newCost != null && newCost > 0) {
            ExpenseCategory expenseCategory = mapActivityTypeToExpenseCategory(updated.getType());
            ExpenseRequest expenseRequest = new ExpenseRequest();
            expenseRequest.setTitle(updated.getTitle());
            expenseRequest.setAmount(newCost);
            expenseRequest.setCategory(expenseCategory.name());
            expenseRequest.setDescription("Auto-added from activity: " + updated.getTitle());
            expenseRequest.setDate(updated.getItinerary().getDate());
            expenseRequest.setTripId(updated.getItinerary().getTrip().getId());

            var expenseResponse = expenseService.createExpense(expenseRequest, userId);
            updated.setLinkedExpenseId(expenseResponse.getId());
            updated = activityRepository.save(updated);
        }

        // Notify trip members about activity update
        travelUpdateNotificationService.notifyActivityUpdated(trip.getId(), activity.getTitle(), userId);

        return mapToResponse(updated);
    }

    @Transactional
    public void deleteActivity(Long id, Long userId) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Activity", "id", id));

        Trip trip = activity.getItinerary().getTrip();
        boolean isOwner = trip.getUser().getId().equals(userId);
        boolean hasEditAccess = tripShareService.hasEditAccess(trip.getId(), userId);
        if (!isOwner && !hasEditAccess) {
            throw new UnauthorizedAccessException("Unauthorized");
        }

        String activityTitle = activity.getTitle();

        if (activity.getLinkedExpenseId() != null) {
            deleteLinkedExpense(activity.getLinkedExpenseId());
            activity.setLinkedExpenseId(null);
        }

        activityRepository.delete(activity);

        // Notify trip members about activity deletion
        travelUpdateNotificationService.notifyActivityDeleted(trip.getId(), activityTitle, userId);
    }

    private void deleteLinkedExpense(Long linkedExpenseId) {
        if (linkedExpenseId == null) {
            return;
        }
        try {
            expenseRepository.findById(linkedExpenseId).ifPresent(expense -> {
                if (expenseSplitRepository != null) {
                    try {
                        expenseSplitRepository.deleteByExpenseId(expense.getId());
                    } catch (Exception ignored) {
                    }
                }
                expenseRepository.delete(expense);
            });
        } catch (Exception ignored) {
        }
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
        response.setReminder(activity.getReminder() != null ? activity.getReminder().name() : null);
        response.setUserId(activity.getUser() != null ? activity.getUser().getId() : null);
        response.setUsername(activity.getUser() != null ? activity.getUser().getUsername() : null);
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