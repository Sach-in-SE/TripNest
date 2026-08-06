package com.tripnest.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class NotificationPreferenceResponse {
    private Long id;
    private Boolean tripReminders;
    private Boolean activityReminders;
    private Boolean budgetAlerts;
    private Boolean groupNotifications;
    private Boolean tripShareNotifications;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
