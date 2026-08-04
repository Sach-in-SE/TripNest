package com.tripnest.repository;

import com.tripnest.entity.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, Long> {
    List<Activity> findByItineraryIdOrderByStartTimeAsc(Long itineraryId);
    List<Activity> findByItinerary_DateAndReminderSentFalse(LocalDate date);
    List<Activity> findByItinerary_Date(LocalDate date);
}