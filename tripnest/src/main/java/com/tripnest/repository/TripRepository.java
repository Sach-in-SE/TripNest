package com.tripnest.repository;

import com.tripnest.entity.Trip;
import com.tripnest.entity.TripStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {
    List<Trip> findByUserId(Long userId);
    List<Trip> findByUserIdAndStatus(Long userId, TripStatus status);
}