package com.tripnest.repository;

import com.tripnest.entity.Trip;
import com.tripnest.entity.TripStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {
    List<Trip> findByUserId(Long userId);
    List<Trip> findByUserIdAndStatus(Long userId, TripStatus status);
    List<Trip> findByStartDateAndReminderSentFalse(LocalDate date);
    List<Trip> findByStartDateBetweenAndReminderSentFalse(LocalDate startDate, LocalDate endDate);
}