package com.tripnest.repository;

import com.tripnest.entity.MemoryVisibility;
import com.tripnest.entity.TravelMemory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TravelMemoryRepository extends JpaRepository<TravelMemory, Long> {

    List<TravelMemory> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<TravelMemory> findByVisibilityOrderByCreatedAtDesc(MemoryVisibility visibility);

    List<TravelMemory> findByTripIdAndUserIdOrderByCreatedAtDesc(Long tripId, Long userId);

    List<TravelMemory> findByDestinationIdAndVisibilityOrderByCreatedAtDesc(Long destinationId, MemoryVisibility visibility);

    Optional<TravelMemory> findByStoredFileName(String storedFileName);
}
