package com.tripnest.service;

import com.tripnest.dto.NotificationRequest;
import com.tripnest.dto.NotificationResponse;
import com.tripnest.entity.Notification;
import com.tripnest.entity.NotificationType;
import com.tripnest.entity.User;
import com.tripnest.repository.NotificationRepository;
import com.tripnest.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import com.tripnest.exception.ResourceNotFoundException;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired(required = false)
    private com.tripnest.repository.NotificationPreferenceRepository notificationPreferenceRepository;

    public com.tripnest.entity.NotificationPreference createDefaultPreferences(User user) {
        if (user == null || notificationPreferenceRepository == null) {
            return null;
        }
        return notificationPreferenceRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    com.tripnest.entity.NotificationPreference pref = new com.tripnest.entity.NotificationPreference();
                    pref.setUser(user);
                    pref.setEmailNotifications(true);
                    pref.setTripReminders(true);
                    pref.setActivityReminders(true);
                    pref.setBudgetAlerts(true);
                    pref.setGroupNotifications(true);
                    pref.setTripShareNotifications(true);
                    return notificationPreferenceRepository.save(pref);
                });
    }

    public com.tripnest.entity.NotificationPreference createDefaultNotificationPreferences(User user) {
        return createDefaultPreferences(user);
    }

    public NotificationResponse createNotification(NotificationRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Notification notification = new Notification();
        notification.setTitle(request.getTitle());
        notification.setMessage(request.getMessage());
        notification.setUser(user);
        notification.setReferenceId(request.getReferenceId());
        if (request.getType() != null) {
            notification.setType(NotificationType.valueOf(request.getType()));
        }

        Notification saved = notificationRepository.save(notification);
        return mapToResponse(saved);
    }

    public List<NotificationResponse> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Page<NotificationResponse> getUserNotifications(Long userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::mapToResponse);
    }

    public List<NotificationResponse> getUnreadNotifications(Long userId) {
        return notificationRepository.findByUserIdAndIsReadFalse(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    public NotificationResponse markAsRead(Long id, Long userId) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        if (!notification.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("Unauthorized");
        }

        notification.setRead(true);
        Notification updated = notificationRepository.save(notification);
        return mapToResponse(updated);
    }

    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalse(userId);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    public void deleteNotification(Long id, Long userId) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        if (!notification.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("Unauthorized");
        }

        notificationRepository.delete(notification);
    }

    private NotificationResponse mapToResponse(Notification notification) {
        NotificationResponse response = new NotificationResponse();
        response.setId(notification.getId());
        response.setTitle(notification.getTitle());
        response.setMessage(notification.getMessage());
        response.setType(notification.getType() != null ? notification.getType().name() : null);
        response.setRead(notification.isRead());
        response.setUserId(notification.getUser().getId());
        response.setReferenceId(notification.getReferenceId());
        response.setCreatedAt(notification.getCreatedAt());
        return response;
    }
}