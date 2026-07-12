package com.tripnest.repository;

import com.tripnest.entity.TravelDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<TravelDocument, Long> {
    List<TravelDocument> findByTripId(Long tripId);
    List<TravelDocument> findByUserId(Long userId);
}