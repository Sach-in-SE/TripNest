package com.tripnest.service;

import com.tripnest.dto.TripRequest;
import com.tripnest.dto.TripResponse;
import com.tripnest.entity.*;
import com.tripnest.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;


@Service
public class TripService {

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
        TripResponse res = mapToResponse(saved);
        res.setPermission("OWNER");
        return res;
    }

    public List<TripResponse> getUserTrips(Long userId) {
        List<TripResponse> ownedTrips = tripRepository.findByUserId(userId)
                .stream()
                .map(trip -> {
                    TripResponse r = mapToResponse(trip);
                    r.setPermission("OWNER");
                    return r;
                })
                .collect(Collectors.toList());

        // Only include shared trips where the invitation has been ACCEPTED
        List<TripResponse> sharedTrips = tripShareRepository
                .findBySharedWithUserIdAndStatus(userId, com.tripnest.entity.ShareStatus.ACCEPTED)
                .stream()
                .map(share -> {
                    TripResponse r = mapToResponse(share.getTrip());
                    r.setPermission(share.getPermission().name());
                    return r;
                })
                .collect(Collectors.toList());

        ownedTrips.addAll(sharedTrips);
        return ownedTrips;
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

        // 7. Delete travel groups
        List<TravelGroup> groups = groupRepository.findByTripId(tripId);
        groupRepository.deleteAll(groups);

        // 8. Delete the trip itself
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