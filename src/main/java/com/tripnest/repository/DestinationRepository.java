package com.tripnest.repository;

import com.tripnest.entity.Destination;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DestinationRepository extends JpaRepository<Destination, Long> {
    List<Destination> findByCategoryIgnoreCase(String category);
    List<Destination> findByNameContainingIgnoreCase(String name);
    List<Destination> findByStateContainingIgnoreCase(String state);
    List<Destination> findByCountryContainingIgnoreCase(String country);
    List<Destination> findByNameContainingIgnoreCaseOrStateContainingIgnoreCaseOrCountryContainingIgnoreCase(String name, String state, String country);
    List<Destination> findAllByOrderByNameAsc();
    List<Destination> findAllByOrderByRatingDesc();
    List<Destination> findAllByOrderByEstimatedBudgetAsc();
    boolean existsByName(String name);
}