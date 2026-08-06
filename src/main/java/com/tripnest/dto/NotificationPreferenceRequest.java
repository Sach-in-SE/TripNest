package com.tripnest.dto;

import lombok.Data;

@Data
public class NotificationPreferenceRequest {
    private Boolean tripReminders;
    private Boolean activityReminders;
    private Boolean budgetAlerts;
    private Boolean groupNotifications;
    private Boolean tripShareNotifications;
}
