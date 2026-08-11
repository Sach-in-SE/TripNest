package com.tripnest.repository;

import com.tripnest.entity.GroupMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupMessageRepository extends JpaRepository<GroupMessage, Long> {
    List<GroupMessage> findByTravelGroupIdOrderByCreatedAtAsc(Long groupId);
    void deleteByTravelGroupId(Long groupId);
}
