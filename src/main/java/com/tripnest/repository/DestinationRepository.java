package com.tripnest.repository;

import com.tripnest.entity.Destination;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

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
    boolean existsByNameIgnoreCaseAndStateIgnoreCaseAndCountryIgnoreCase(String name, String state, String country);
    Optional<Destination> findByNameIgnoreCaseAndStateIgnoreCaseAndCountryIgnoreCase(String name, String state, String country);
    Optional<Destination> findByNameIgnoreCase(String name);
}