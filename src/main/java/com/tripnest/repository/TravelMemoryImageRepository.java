package com.tripnest.repository;

import com.tripnest.entity.TravelMemoryImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TravelMemoryImageRepository extends JpaRepository<TravelMemoryImage, Long> {

    Optional<TravelMemoryImage> findByStoredFileName(String storedFileName);

    List<TravelMemoryImage> findByTravelMemoryIdOrderByDisplayOrderAsc(Long memoryId);

    void deleteByTravelMemoryId(Long memoryId);
}
