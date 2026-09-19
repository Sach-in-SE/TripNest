package com.tripnest.repository;

import com.tripnest.entity.Itinerary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ItineraryRepository extends JpaRepository<Itinerary, Long> {
    List<Itinerary> findByTripIdOrderByDateAsc(Long tripId);

    @Query("SELECT i FROM Itinerary i JOIN FETCH i.trip t LEFT JOIN FETCH i.user u WHERE t.id = :tripId ORDER BY i.date ASC")
    List<Itinerary> findByTripIdWithTripAndUserOrderByDateAsc(@Param("tripId") Long tripId);

    List<Itinerary> findByUserId(Long userId);

    @Modifying
    @Query("DELETE FROM Itinerary i WHERE i.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM Itinerary i WHERE i.trip.id = :tripId")
    void deleteByTripId(@Param("tripId") Long tripId);
}