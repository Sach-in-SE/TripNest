package com.tripnest.repository;

import com.tripnest.entity.TravelGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupRepository extends JpaRepository<TravelGroup, Long> {

    List<TravelGroup> findByCreatedById(Long userId);

    List<TravelGroup> findByMembersId(Long userId);

    List<TravelGroup> findByTripId(Long tripId);
}