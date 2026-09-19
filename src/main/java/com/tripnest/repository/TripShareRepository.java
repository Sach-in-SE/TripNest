package com.tripnest.repository;

import com.tripnest.entity.ShareStatus;
import com.tripnest.entity.TripShare;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TripShareRepository extends JpaRepository<TripShare, Long> {
    List<TripShare> findByTripId(Long tripId);
    List<TripShare> findBySharedWithUserId(Long userId);
    List<TripShare> findBySharedWithUserIdAndStatus(Long userId, ShareStatus status);

    @Query("SELECT ts FROM TripShare ts JOIN FETCH ts.trip t JOIN FETCH t.user WHERE ts.sharedWithUser.id = :userId AND ts.status = :status")
    List<TripShare> findBySharedWithUserIdAndStatusWithTripAndUser(@Param("userId") Long userId, @Param("status") ShareStatus status);

    Optional<TripShare> findByTripIdAndSharedWithUserId(Long tripId, Long userId);
    void deleteByTripIdAndSharedWithUserId(Long tripId, Long userId);

    @Modifying
    @Query("DELETE FROM TripShare ts WHERE ts.sharedWithUser.id = :userId OR ts.sharedByUser.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);
}