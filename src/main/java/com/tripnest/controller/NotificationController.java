package com.tripnest.controller;

import com.tripnest.dto.MessageResponse;
import com.tripnest.dto.NotificationRequest;
import com.tripnest.dto.NotificationResponse;
import com.tripnest.security.UserDetailsImpl;
import com.tripnest.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @PostMapping
    public ResponseEntity<?> createNotification(@RequestBody NotificationRequest request) {
        UserDetailsImpl userDetails = getCurrentUser();
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin && (request.getUserId() != null && !request.getUserId().equals(userDetails.getId()))) {
            throw new org.springframework.security.access.AccessDeniedException("Cannot create notifications for other users");
        }
        if (request.getUserId() == null) {
            request.setUserId(userDetails.getId());
        }
        NotificationResponse response = notificationService.createNotification(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<?> getUserNotifications(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        UserDetailsImpl userDetails = getCurrentUser();
        if (page != null) {
            int pageSize = (size != null && size > 0 && size <= 100) ? size : 20;
            Page<NotificationResponse> result = notificationService.getUserNotifications(
                    userDetails.getId(), PageRequest.of(page, pageSize));
            return ResponseEntity.ok(result);
        }
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
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated principal is missing");
        }
        Object principal = authentication.getPrincipal();
        if (!(principal instanceof UserDetailsImpl)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Authenticated principal is invalid: " + principal.getClass().getName());
        }
        return (UserDetailsImpl) principal;
    }
}