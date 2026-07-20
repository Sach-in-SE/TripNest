package com.tripnest.repository;

import com.tripnest.entity.ShareStatus;
import com.tripnest.entity.TripShare;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TripShareRepository extends JpaRepository<TripShare, Long> {
    List<TripShare> findByTripId(Long tripId);
    List<TripShare> findBySharedWithUserId(Long userId);
    List<TripShare> findBySharedWithUserIdAndStatus(Long userId, ShareStatus status);
    Optional<TripShare> findByTripIdAndSharedWithUserId(Long tripId, Long userId);
    void deleteByTripIdAndSharedWithUserId(Long tripId, Long userId);
}