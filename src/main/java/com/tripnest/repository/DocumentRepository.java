package com.tripnest.repository;

import com.tripnest.entity.TravelDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentRepository extends JpaRepository<TravelDocument, Long> {
    List<TravelDocument> findByTripId(Long tripId);
    List<TravelDocument> findByUserId(Long userId);
    Optional<TravelDocument> findByStoredFileName(String storedFileName);
    Optional<TravelDocument> findByFileUrlEndingWith(String suffix);

    @Modifying
    @Query("DELETE FROM TravelDocument d WHERE d.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM TravelDocument d WHERE d.trip.id = :tripId")
    void deleteByTripId(@Param("tripId") Long tripId);
}