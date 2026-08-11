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
    
    // For trip reminders
    List<Trip> findByStartDate(LocalDate date);
    List<Trip> findByEndDate(LocalDate date);
    List<Trip> findByStartDateBeforeAndEndDateAfter(LocalDate startDate, LocalDate endDate);
}