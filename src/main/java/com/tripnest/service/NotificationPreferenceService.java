package com.tripnest.service;

import com.tripnest.dto.NotificationPreferenceRequest;
import com.tripnest.dto.NotificationPreferenceResponse;
import com.tripnest.entity.NotificationPreference;
import com.tripnest.entity.User;
import com.tripnest.repository.NotificationPreferenceRepository;
import com.tripnest.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class NotificationPreferenceService {

    @Autowired
    private NotificationPreferenceRepository notificationPreferenceRepository;

    @Autowired
    private UserRepository userRepository;

    public NotificationPreferenceResponse getPreferences(Long userId) {
        Optional<NotificationPreference> preferenceOpt = notificationPreferenceRepository.findByUserId(userId);
        if (preferenceOpt.isPresent()) {
            return mapToResponse(preferenceOpt.get());
        }
        return new NotificationPreferenceResponse();
    }

    public NotificationPreferenceResponse createOrUpdatePreferences(NotificationPreferenceRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        NotificationPreference preference = notificationPreferenceRepository.findByUserId(userId)
                .orElse(new NotificationPreference());

        preference.setUser(user);

        if (request.getTripReminders() != null) {
            preference.setTripReminders(request.getTripReminders());
        }
        if (request.getActivityReminders() != null) {
            preference.setActivityReminders(request.getActivityReminders());
        }
        if (request.getBudgetAlerts() != null) {
            preference.setBudgetAlerts(request.getBudgetAlerts());
        }
        if (request.getGroupNotifications() != null) {
            preference.setGroupNotifications(request.getGroupNotifications());
        }
        if (request.getTripShareNotifications() != null) {
            preference.setTripShareNotifications(request.getTripShareNotifications());
        }

        NotificationPreference saved = notificationPreferenceRepository.save(preference);
        return mapToResponse(saved);
    }

    private NotificationPreferenceResponse mapToResponse(NotificationPreference preference) {
        NotificationPreferenceResponse response = new NotificationPreferenceResponse();
        response.setId(preference.getId());
        response.setTripReminders(preference.isTripReminders());
        response.setActivityReminders(preference.isActivityReminders());
        response.setBudgetAlerts(preference.isBudgetAlerts());
        response.setGroupNotifications(preference.isGroupNotifications());
        response.setTripShareNotifications(preference.isTripShareNotifications());
        response.setCreatedAt(preference.getCreatedAt());
        response.setUpdatedAt(preference.getUpdatedAt());
        return response;
    }
}
