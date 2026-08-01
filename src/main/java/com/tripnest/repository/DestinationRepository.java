package com.tripnest.repository;

import com.tripnest.entity.Destination;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DestinationRepository extends JpaRepository<Destination, Long> {
    List<Destination> findByPopularTrue();
    List<Destination> findByCountryIgnoreCase(String country);
    List<Destination> findByNameContainingIgnoreCase(String name);
}