package com.tripnest.service;

import com.tripnest.dto.TripShareRequest;
import com.tripnest.dto.TripShareResponse;
import com.tripnest.entity.SharePermission;
import com.tripnest.entity.Trip;
import com.tripnest.entity.TripShare;
import com.tripnest.entity.User;
import com.tripnest.repository.TripRepository;
import com.tripnest.repository.TripShareRepository;
import com.tripnest.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TripShareService {

    @Autowired
    private TripShareRepository tripShareRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private UserRepository userRepository;

    public TripShareResponse shareTrip(TripShareRequest request, Long ownerId) {
        Trip trip = tripRepository.findById(request.getTripId())
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        if (!trip.getUser().getId().equals(ownerId)) {
            throw new RuntimeException("Only the trip owner can share this trip");
        }

        User targetUser = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("No user found with this email"));

        if (targetUser.getId().equals(ownerId)) {
            throw new RuntimeException("You cannot share a trip with yourself");
        }

        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("Owner not found"));

        TripShare share = tripShareRepository.findByTripIdAndSharedWithUserId(trip.getId(), targetUser.getId())
                .orElse(new TripShare());

        share.setTrip(trip);
        share.setSharedWithUser(targetUser);
        share.setSharedByUser(owner);
        share.setPermission(request.getPermission() != null
                ? SharePermission.valueOf(request.getPermission())
                : SharePermission.VIEW);

        TripShare saved = tripShareRepository.save(share);
        return mapToResponse(saved);
    }

    public List<TripShareResponse> getTripShares(Long tripId, Long ownerId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        if (!trip.getUser().getId().equals(ownerId)) {
            throw new RuntimeException("Unauthorized");
        }

        return tripShareRepository.findByTripId(tripId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<TripShareResponse> getTripsSharedWithMe(Long userId) {
        return tripShareRepository.findBySharedWithUserId(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void removeShare(Long tripId, Long targetUserId, Long ownerId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        if (!trip.getUser().getId().equals(ownerId)) {
            throw new RuntimeException("Unauthorized");
        }

        TripShare share = tripShareRepository.findByTripIdAndSharedWithUserId(tripId, targetUserId)
                .orElseThrow(() -> new RuntimeException("Share access not found"));

        tripShareRepository.delete(share);
    }

    // Helper: dusre services (jaise TripService) se access check ke liye use hoga
    public boolean hasAccess(Long tripId, Long userId) {
        return tripShareRepository.findByTripIdAndSharedWithUserId(tripId, userId).isPresent();
    }

    public boolean hasEditAccess(Long tripId, Long userId) {
        return tripShareRepository.findByTripIdAndSharedWithUserId(tripId, userId)
                .map(share -> share.getPermission() == SharePermission.EDIT)
                .orElse(false);
    }

    private TripShareResponse mapToResponse(TripShare share) {
        TripShareResponse response = new TripShareResponse();
        response.setId(share.getId());
        response.setTripId(share.getTrip().getId());
        response.setTripTitle(share.getTrip().getTitle());
        response.setSharedWithUserId(share.getSharedWithUser().getId());
        response.setSharedWithUsername(share.getSharedWithUser().getUsername());
        response.setSharedWithEmail(share.getSharedWithUser().getEmail());
        response.setSharedByUserId(share.getSharedByUser().getId());
        response.setSharedByUsername(share.getSharedByUser().getUsername());
        response.setPermission(share.getPermission().name());
        response.setCreatedAt(share.getCreatedAt());
        return response;
    }
}