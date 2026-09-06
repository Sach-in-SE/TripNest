package com.tripnest.repository;

import com.tripnest.entity.GroupMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupMessageRepository extends JpaRepository<GroupMessage, Long> {

    List<GroupMessage> findByTravelGroupIdOrderByCreatedAtAsc(Long groupId);

    @Query("SELECT gm FROM GroupMessage gm JOIN FETCH gm.sender WHERE gm.travelGroup.id = :groupId ORDER BY gm.createdAt ASC")
    List<GroupMessage> findByTravelGroupIdWithSenderOrderByCreatedAtAsc(@Param("groupId") Long groupId);

    @Query("SELECT gm FROM GroupMessage gm JOIN FETCH gm.sender WHERE gm.travelGroup.id = :groupId ORDER BY gm.createdAt DESC")
    List<GroupMessage> findRecentByTravelGroupIdWithSender(@Param("groupId") Long groupId, Pageable pageable);

    void deleteByTravelGroupId(Long groupId);
}
