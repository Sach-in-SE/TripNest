package com.tripnest.repository;

import com.tripnest.entity.TravelGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupRepository extends JpaRepository<TravelGroup, Long> {

    List<TravelGroup> findByCreatedById(Long userId);

    List<TravelGroup> findByMembersId(Long userId);

    List<TravelGroup> findByTripId(Long tripId);

    boolean existsByTripIdAndMembersId(Long tripId, Long userId);

    @Query("SELECT DISTINCT g FROM TravelGroup g " +
           "JOIN FETCH g.trip t " +
           "JOIN FETCH g.createdBy u " +
           "LEFT JOIN FETCH g.members " +
           "WHERE g.id = :groupId")
    Optional<TravelGroup> findByIdWithDetails(@Param("groupId") Long groupId);

    @Query("SELECT DISTINCT g FROM TravelGroup g " +
           "JOIN FETCH g.trip t " +
           "JOIN FETCH g.createdBy u " +
           "LEFT JOIN FETCH g.members " +
           "WHERE g.createdBy.id = :userId")
    List<TravelGroup> findByCreatedByIdWithDetails(@Param("userId") Long userId);

    @Query("SELECT DISTINCT g FROM TravelGroup g " +
           "JOIN FETCH g.trip t " +
           "JOIN FETCH g.createdBy u " +
           "LEFT JOIN FETCH g.members " +
           "WHERE g.id IN (SELECT g2.id FROM TravelGroup g2 JOIN g2.members m2 WHERE m2.id = :userId)")
    List<TravelGroup> findByMembersIdWithDetails(@Param("userId") Long userId);

    @Query("SELECT DISTINCT g FROM TravelGroup g " +
           "JOIN FETCH g.trip t " +
           "JOIN FETCH g.createdBy u " +
           "LEFT JOIN FETCH g.members " +
           "WHERE g.trip.id = :tripId")
    List<TravelGroup> findByTripIdWithDetails(@Param("tripId") Long tripId);

    @Modifying
    @Query(value = "DELETE FROM group_members WHERE user_id = :userId", nativeQuery = true)
    void deleteGroupMemberJoinTableByUserId(@Param("userId") Long userId);

    @Modifying
    @Query(value = "DELETE FROM group_members WHERE group_id = :groupId", nativeQuery = true)
    void deleteGroupMemberJoinTableByGroupId(@Param("groupId") Long groupId);
}