package com.tripnest.repository;

import com.tripnest.entity.MemoryVisibility;
import com.tripnest.entity.TravelMemory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TravelMemoryRepository extends JpaRepository<TravelMemory, Long> {

    List<TravelMemory> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<TravelMemory> findByVisibilityOrderByCreatedAtDesc(MemoryVisibility visibility);

    List<TravelMemory> findByTripIdAndUserIdOrderByCreatedAtDesc(Long tripId, Long userId);

    List<TravelMemory> findByDestinationIdAndVisibilityOrderByCreatedAtDesc(Long destinationId, MemoryVisibility visibility);

    List<TravelMemory> findTop3ByDestinationIdAndVisibilityOrderByCreatedAtDesc(Long destinationId, MemoryVisibility visibility);

    Page<TravelMemory> findByDestinationIdAndVisibilityOrderByCreatedAtDesc(Long destinationId, MemoryVisibility visibility, Pageable pageable);

    @Modifying
    @Query("UPDATE TravelMemory m SET m.destination = null WHERE m.destination.id = :destinationId")
    void nullifyDestinationReferences(@Param("destinationId") Long destinationId);

    Optional<TravelMemory> findByStoredFileName(String storedFileName);
}
