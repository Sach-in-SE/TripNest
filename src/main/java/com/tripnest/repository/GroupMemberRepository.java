package com.tripnest.repository;

import com.tripnest.entity.GroupInvitationStatus;
import com.tripnest.entity.GroupMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {
    List<GroupMember> findByTravelGroupIdAndStatusOrderByJoinedAtAsc(Long groupId, GroupInvitationStatus status);
    List<GroupMember> findByTravelGroupIdAndStatusOrderByInvitedAtDesc(Long groupId, GroupInvitationStatus status);
    List<GroupMember> findByUserIdAndStatusOrderByInvitedAtDesc(Long userId, GroupInvitationStatus status);

    @Query("SELECT gm FROM GroupMember gm " +
           "JOIN FETCH gm.travelGroup tg " +
           "JOIN FETCH tg.trip " +
           "JOIN FETCH gm.user " +
           "LEFT JOIN FETCH gm.invitedBy " +
           "WHERE tg.id = :groupId AND gm.status = :status ORDER BY gm.joinedAt ASC")
    List<GroupMember> findByTravelGroupIdAndStatusWithDetailsOrderByJoinedAtAsc(@Param("groupId") Long groupId, @Param("status") GroupInvitationStatus status);

    @Query("SELECT gm FROM GroupMember gm " +
           "JOIN FETCH gm.travelGroup tg " +
           "JOIN FETCH tg.trip " +
           "JOIN FETCH gm.user " +
           "LEFT JOIN FETCH gm.invitedBy " +
           "WHERE tg.id = :groupId AND gm.status = :status ORDER BY gm.invitedAt DESC")
    List<GroupMember> findByTravelGroupIdAndStatusWithDetailsOrderByInvitedAtDesc(@Param("groupId") Long groupId, @Param("status") GroupInvitationStatus status);

    @Query("SELECT gm FROM GroupMember gm " +
           "JOIN FETCH gm.travelGroup tg " +
           "JOIN FETCH tg.trip " +
           "JOIN FETCH gm.user " +
           "LEFT JOIN FETCH gm.invitedBy " +
           "WHERE gm.user.id = :userId AND gm.status = :status ORDER BY gm.invitedAt DESC")
    List<GroupMember> findByUserIdAndStatusWithDetailsOrderByInvitedAtDesc(@Param("userId") Long userId, @Param("status") GroupInvitationStatus status);

    @Query("SELECT gm FROM GroupMember gm " +
           "JOIN FETCH gm.travelGroup tg " +
           "JOIN FETCH gm.user " +
           "WHERE tg.id IN :groupIds AND gm.user.id = :userId")
    List<GroupMember> findByTravelGroupIdInAndUserIdWithGroup(@Param("groupIds") List<Long> groupIds, @Param("userId") Long userId);

    Optional<GroupMember> findByTravelGroupIdAndUserId(Long groupId, Long userId);
    boolean existsByTravelGroupIdAndUserId(Long groupId, Long userId);
    boolean existsByTravelGroupTripIdAndUserId(Long tripId, Long userId);
    void deleteByTravelGroupId(Long groupId);

    @Modifying
    @Query("UPDATE GroupMember gm SET gm.invitedBy = null WHERE gm.invitedBy.id = :userId")
    void nullifyInviterReferences(@Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM GroupMember gm WHERE gm.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);
}