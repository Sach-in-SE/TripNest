package com.tripnest.repository;

import com.tripnest.entity.NotificationPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface NotificationPreferenceRepository extends JpaRepository<NotificationPreference, Long> {
    Optional<NotificationPreference> findByUserId(Long userId);
}
