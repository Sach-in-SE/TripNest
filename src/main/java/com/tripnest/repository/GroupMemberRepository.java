package com.tripnest.repository;

import com.tripnest.entity.GroupInvitationStatus;
import com.tripnest.entity.GroupMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {
    List<GroupMember> findByTravelGroupIdAndStatusOrderByJoinedAtAsc(Long groupId, GroupInvitationStatus status);
    List<GroupMember> findByTravelGroupIdAndStatusOrderByInvitedAtDesc(Long groupId, GroupInvitationStatus status);
    List<GroupMember> findByUserIdAndStatusOrderByInvitedAtDesc(Long userId, GroupInvitationStatus status);
    Optional<GroupMember> findByTravelGroupIdAndUserId(Long groupId, Long userId);
    boolean existsByTravelGroupIdAndUserId(Long groupId, Long userId);
    boolean existsByTravelGroupTripIdAndUserId(Long tripId, Long userId);
    void deleteByTravelGroupId(Long groupId);
}