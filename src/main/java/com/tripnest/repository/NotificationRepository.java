package com.tripnest.repository;

import com.tripnest.entity.Notification;
import com.tripnest.entity.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Notification> findByUserIdAndIsReadFalse(Long userId);
    long countByUserIdAndIsReadFalse(Long userId);
    
    // For duplicate prevention
    Optional<Notification> findByUserIdAndTypeAndReferenceId(Long userId, NotificationType type, Long referenceId);
    boolean existsByUserIdAndTypeAndReferenceId(Long userId, NotificationType type, Long referenceId);
    boolean existsByUserIdAndTypeAndTitleAndReferenceId(Long userId, NotificationType type, String title, Long referenceId);
    boolean existsByUserIdAndTypeAndTitleAndMessageAndReferenceId(Long userId, NotificationType type, String title, String message, Long referenceId);
}