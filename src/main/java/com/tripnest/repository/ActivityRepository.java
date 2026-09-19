package com.tripnest.repository;

import com.tripnest.entity.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, Long> {
    List<Activity> findByItineraryIdOrderByStartTimeAsc(Long itineraryId);

    @Query("SELECT a FROM Activity a LEFT JOIN FETCH a.user u WHERE a.itinerary.id IN :itineraryIds ORDER BY a.startTime ASC")
    List<Activity> findByItineraryIdInWithUserOrderByStartTimeAsc(@Param("itineraryIds") List<Long> itineraryIds);

    List<Activity> findByItinerary_Date(LocalDate date);

    @Modifying
    @Query("DELETE FROM Activity a WHERE a.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM Activity a WHERE a.itinerary.id = :itineraryId")
    void deleteByItineraryId(@Param("itineraryId") Long itineraryId);

    @Modifying
    @Query("DELETE FROM Activity a WHERE a.itinerary.id IN :itineraryIds")
    void deleteByItineraryIdIn(@Param("itineraryIds") List<Long> itineraryIds);
}