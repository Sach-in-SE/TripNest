package com.tripnest.service;

import com.tripnest.dto.TripRequest;
import com.tripnest.dto.TripResponse;
import com.tripnest.dto.TravelHistoryResponse;
import com.tripnest.dto.BudgetRequest;
import com.tripnest.entity.*;
import com.tripnest.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashSet;
import java.util.Set;
import java.util.HashMap;
import java.util.Map;
import java.util.ArrayList;


@Service
public class TripService {

    private static final Logger logger = LoggerFactory.getLogger(TripService.class);

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TripShareService tripShareService;

    @Autowired
    private TripShareRepository tripShareRepository;

    @Autowired
    private ItineraryRepository itineraryRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private BudgetRepository budgetRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private GroupMemberRepository groupMemberRepository;

    @Autowired
    private BudgetService budgetService;

    @Autowired
    private TravelUpdateNotificationService travelUpdateNotificationService;

    public TripResponse createTrip(TripRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Validate dates
        if (request.getStartDate() != null && request.getEndDate() != null) {
            if (request.getEndDate().isBefore(request.getStartDate())) {
                throw new RuntimeException("End date must be on or after start date");
            }
        }

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

        if (request.getBudget() != null && request.getBudget() > 0) {
            BudgetRequest budgetRequest = new BudgetRequest();
            budgetRequest.setTotalAmount(request.getBudget());
            budgetRequest.setTripId(saved.getId());
            budgetRequest.setCurrency("INR");
            budgetService.createOrUpdateBudget(budgetRequest, userId);
        }

        TripResponse res = mapToResponse(saved);
        res.setPermission("OWNER");
        return res;
    }

    public List<TripResponse> getUserTrips(Long userId) {
        Map<Long, TripResponse> tripsMap = new java.util.LinkedHashMap<>();

        tripRepository.findByUserId(userId)
                .forEach(trip -> {
                    TripResponse r = mapToResponse(trip);
                    r.setPermission("OWNER");
                    tripsMap.put(trip.getId(), r);
                });

        // Only include shared trips where invitation is ACCEPTED and not already present
        tripShareRepository
                .findBySharedWithUserIdAndStatus(userId, com.tripnest.entity.ShareStatus.ACCEPTED)
                .forEach(share -> {
                    Long tripId = share.getTrip().getId();
                    if (!tripsMap.containsKey(tripId)) {
                        TripResponse r = mapToResponse(share.getTrip());
                        r.setPermission(share.getPermission().name());
                        tripsMap.put(tripId, r);
                    }
                });

        return new ArrayList<>(tripsMap.values());
    }

    public TripResponse getTripById(Long tripId, Long userId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));
        boolean isOwner = trip.getUser().getId().equals(userId);

        TripResponse response = mapToResponse(trip);
        if (isOwner) {
            response.setPermission("OWNER");
        } else {
            TripShare share = tripShareRepository.findByTripIdAndSharedWithUserId(tripId, userId)
                    .filter(s -> s.getStatus() == com.tripnest.entity.ShareStatus.ACCEPTED)
                    .orElseThrow(() -> new RuntimeException("Unauthorized"));
            response.setPermission(share.getPermission().name());
        }
        return response;
    }

    public TripResponse updateTrip(Long tripId, TripRequest request, Long userId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));
        boolean isOwner = trip.getUser().getId().equals(userId);
        boolean hasEditAccess = tripShareService.hasEditAccess(tripId, userId);
        if (!isOwner && !hasEditAccess) {
            throw new RuntimeException("Unauthorized");
        }

        // Validate dates
        if (request.getStartDate() != null && request.getEndDate() != null) {
            if (request.getEndDate().isBefore(request.getStartDate())) {
                throw new RuntimeException("End date must be on or after start date");
            }
        }

        // Track if meaningful details changed for notification
        boolean detailsChanged = false;
        if (!trip.getTitle().equals(request.getTitle()) ||
            !trip.getDestination().equals(request.getDestination()) ||
            (trip.getStartDate() != null && !trip.getStartDate().equals(request.getStartDate())) ||
            (trip.getEndDate() != null && !trip.getEndDate().equals(request.getEndDate())) ||
            (trip.getStatus() != null && !trip.getStatus().name().equals(request.getStatus()))) {
            detailsChanged = true;
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

        // Send notification if trip details changed
        if (detailsChanged) {
            travelUpdateNotificationService.notifyTripDetailsUpdated(tripId, userId);
        }

        budgetRepository.findByTripId(tripId).ifPresentOrElse(
            budget -> {
                if (request.getBudget() != null && request.getBudget() > 0 && !request.getBudget().equals(budget.getTotalAmount())) {
                    BudgetRequest budgetRequest = new BudgetRequest();
                    budgetRequest.setTotalAmount(request.getBudget());
                    budgetRequest.setTripId(tripId);
                    budgetRequest.setCurrency(budget.getCurrency());
                    budgetService.createOrUpdateBudget(budgetRequest, userId);
                    // Send budget update notification
                    travelUpdateNotificationService.notifyBudgetUpdated(tripId, userId);
                }
            },
            () -> {
                if (request.getBudget() != null && request.getBudget() > 0) {
                    BudgetRequest budgetRequest = new BudgetRequest();
                    budgetRequest.setTotalAmount(request.getBudget());
                    budgetRequest.setTripId(tripId);
                    budgetRequest.setCurrency("INR");
                    budgetService.createOrUpdateBudget(budgetRequest, userId);
                    // Send budget update notification
                    travelUpdateNotificationService.notifyBudgetUpdated(tripId, userId);
                }
            }
        );

        TripResponse r = mapToResponse(updated);
        if (isOwner) {
            r.setPermission("OWNER");
        } else {
            TripShare share = tripShareRepository.findByTripIdAndSharedWithUserId(tripId, userId)
                    .orElseThrow(() -> new RuntimeException("Unauthorized"));
            r.setPermission(share.getPermission().name());
        }
        return r;
    }
    
    @org.springframework.transaction.annotation.Transactional
    public void deleteTrip(Long tripId, Long userId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));
        if (!trip.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        // 1. Delete activities first (which reference itineraries)
        List<Itinerary> itineraries = itineraryRepository.findByTripIdOrderByDateAsc(tripId);
        for (Itinerary itinerary : itineraries) {
            List<Activity> activities = activityRepository.findByItineraryIdOrderByStartTimeAsc(itinerary.getId());
            activityRepository.deleteAll(activities);
        }
        // 2. Delete itineraries
        itineraryRepository.deleteAll(itineraries);

        // 3. Delete trip shares (completely bypass any accepted or pending share statuses checks)
        List<TripShare> shares = tripShareRepository.findByTripId(tripId);
        tripShareRepository.deleteAll(shares);

        // 4. Delete budget
        budgetRepository.findByTripId(tripId).ifPresent(budget -> budgetRepository.delete(budget));

        // 5. Delete expenses
        List<Expense> expenses = expenseRepository.findByTripId(tripId);
        expenseRepository.deleteAll(expenses);

        // 6. Delete documents and remove corresponding files from disk if possible
        List<TravelDocument> documents = documentRepository.findByTripId(tripId);
        for (TravelDocument document : documents) {
            try {
                String storedFileName = document.getFileUrl().substring(document.getFileUrl().lastIndexOf("/") + 1);
                Path filePath = Paths.get("uploads").resolve(storedFileName);
                Files.deleteIfExists(filePath);
            } catch (Exception e) {
                // Ignore file deletion error and proceed with DB deletion
            }
        }
        documentRepository.deleteAll(documents);

        // 7. Delete travel groups (and their members first to prevent FK constraint violations)
        List<TravelGroup> groups = groupRepository.findByTripId(tripId);
        for (TravelGroup group : groups) {
            groupMemberRepository.deleteByTravelGroupId(group.getId());
        }
        groupRepository.deleteAll(groups);

        // 8. Delete the trip itself
        tripRepository.delete(trip);
    }

    public TravelHistoryResponse getTravelHistory(Long userId) {
        List<Trip> completedTrips = tripRepository.findByUserIdAndStatus(userId, TripStatus.COMPLETED);

        Set<String> destinationsVisited = new HashSet<>();
        Double totalAmountSpent = 0.0;
        Map<String, Integer> destinationCount = new HashMap<>();
        List<Double> tripDurations = new ArrayList<>();
        String longestTrip = null;
        long maxDuration = 0;

        for (Trip trip : completedTrips) {
            destinationsVisited.add(trip.getDestination());

            Long tripId = trip.getId();
            Double tripExpenses = expenseRepository.getTotalExpenseByTripId(tripId);
            if (tripExpenses != null) {
                totalAmountSpent += tripExpenses;
            }

            String destination = trip.getDestination();
            destinationCount.put(destination, destinationCount.getOrDefault(destination, 0) + 1);

            if (trip.getStartDate() != null && trip.getEndDate() != null) {
                long duration = java.time.temporal.ChronoUnit.DAYS.between(trip.getStartDate(), trip.getEndDate()) + 1;
                tripDurations.add((double) duration);
                if (duration > maxDuration) {
                    maxDuration = duration;
                    longestTrip = trip.getTitle();
                }
            }
        }

        Double averageTripDuration = tripDurations.isEmpty() ? 0.0 :
            tripDurations.stream().mapToDouble(d -> d).average().orElse(0.0);

        String mostVisitedDestination = destinationCount.entrySet().stream()
            .max(Map.Entry.comparingByValue())
            .map(Map.Entry::getKey)
            .orElse(null);

        TravelHistoryResponse response = new TravelHistoryResponse();
        response.setTotalCompletedTrips(completedTrips.size());
        response.setTotalAmountSpent(totalAmountSpent);
        response.setDestinationsVisited(destinationsVisited.stream().sorted().collect(Collectors.toList()));
        response.setAverageTripDuration(averageTripDuration);
        response.setLongestTrip(longestTrip);
        response.setMostVisitedDestination(mostVisitedDestination);
        response.setCompletedTrips(completedTrips.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList()));

        return response;
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
        
        // Add owner information for PDF export
        String ownerName = trip.getUser().getFirstName() != null && trip.getUser().getLastName() != null
            ? trip.getUser().getFirstName() + " " + trip.getUser().getLastName()
            : trip.getUser().getUsername();
        response.setOwnerName(ownerName);
        response.setOwnerEmail(trip.getUser().getEmail());
        
        return response;
    }
}