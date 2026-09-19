package com.tripnest.service;

import com.tripnest.entity.Trip;
import com.tripnest.exception.BadRequestException;
import com.tripnest.exception.ResourceNotFoundException;
import com.tripnest.exception.UnauthorizedAccessException;
import com.tripnest.repository.TripRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class TripTimelineValidator {

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private TripShareService tripShareService;

    /**
     * Validates if a date falls within the trip's start and end dates.
     * 
     * @param tripId The trip ID
     * @param date The date to validate
     * @param userId The user ID for authorization check
     * @throws UnauthorizedAccessException if user is unauthorized
     * @throws ResourceNotFoundException if the trip is not found
     * @throws BadRequestException if the date is outside the trip timeline
     */
    public void validateDateWithinTripTimeline(Long tripId, LocalDate date, Long userId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip", "id", tripId));

        boolean isOwner = trip.getUser().getId().equals(userId);
        boolean hasAccess = tripShareService.hasAccess(tripId, userId);
        if (!isOwner && !hasAccess) {
            throw new UnauthorizedAccessException("Unauthorized");
        }

        if (date.isBefore(trip.getStartDate()) || date.isAfter(trip.getEndDate())) {
            throw new BadRequestException("Date must fall within the trip duration.");
        }
    }

    /**
     * Checks if a date falls within the trip's start and end dates.
     * 
     * @param trip The trip entity
     * @param date The date to check
     * @return true if the date is within the trip timeline, false otherwise
     */
    public boolean isDateWithinTripTimeline(Trip trip, LocalDate date) {
        if (trip.getStartDate() == null || trip.getEndDate() == null) {
            return false;
        }
        return !date.isBefore(trip.getStartDate()) && !date.isAfter(trip.getEndDate());
    }

    /**
     * Gets the trip entity for timeline validation.
     * 
     * @param tripId The trip ID
     * @return The trip entity
     * @throws ResourceNotFoundException if the trip is not found
     */
    public Trip getTripForValidation(Long tripId) {
        return tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip", "id", tripId));
    }
}