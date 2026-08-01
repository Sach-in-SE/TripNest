package com.tripnest.controller;

import com.tripnest.dto.MessageResponse;
import com.tripnest.dto.NotificationRequest;
import com.tripnest.dto.NotificationResponse;
import com.tripnest.security.UserDetailsImpl;
import com.tripnest.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @PostMapping
    public ResponseEntity<?> createNotification(@RequestBody NotificationRequest request) {
        NotificationResponse response = notificationService.createNotification(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<?> getUserNotifications() {
        UserDetailsImpl userDetails = getCurrentUser();
        List<NotificationResponse> notifications = notificationService.getUserNotifications(userDetails.getId());
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/unread")
    public ResponseEntity<?> getUnreadNotifications() {
        UserDetailsImpl userDetails = getCurrentUser();
        List<NotificationResponse> notifications = notificationService.getUnreadNotifications(userDetails.getId());
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/unread/count")
    public ResponseEntity<?> getUnreadCount() {
        UserDetailsImpl userDetails = getCurrentUser();
        long count = notificationService.getUnreadCount(userDetails.getId());
        return ResponseEntity.ok(count);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        UserDetailsImpl userDetails = getCurrentUser();
        NotificationResponse response = notificationService.markAsRead(id, userDetails.getId());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead() {
        UserDetailsImpl userDetails = getCurrentUser();
        notificationService.markAllAsRead(userDetails.getId());
        return ResponseEntity.ok(new MessageResponse("All notifications marked as read!"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable Long id) {
        UserDetailsImpl userDetails = getCurrentUser();
        notificationService.deleteNotification(id, userDetails.getId());
        return ResponseEntity.ok(new MessageResponse("Notification deleted!"));
    }

    private UserDetailsImpl getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (UserDetailsImpl) authentication.getPrincipal();
    }
}