package com.tripnest.dto;

import lombok.Data;

@Data
public class NotificationPreferenceRequest {
    private Boolean emailNotifications;
    private Boolean email;
    private Boolean tripReminders;
    private Boolean activityReminders;
    private Boolean budgetAlerts;
    private Boolean groupNotifications;
    private Boolean tripShareNotifications;

    public Boolean getEffectiveEmailNotifications() {
        if (emailNotifications != null) {
            return emailNotifications;
        }
        return email;
    }
}
