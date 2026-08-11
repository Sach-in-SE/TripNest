package com.tripnest.service;

import com.tripnest.entity.Notification;
import com.tripnest.entity.NotificationType;
import com.tripnest.entity.User;
import com.tripnest.repository.NotificationRepository;
import com.tripnest.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private NotificationService notificationService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setUsername("testuser");
    }

    @Test
    void testCreateNotification_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var request = new com.tripnest.dto.NotificationRequest();
        request.setUserId(1L);
        request.setTitle("Test Title");
        request.setMessage("Test Message");
        request.setType("TRIP_REMINDER");
        request.setReferenceId(1L);

        var response = notificationService.createNotification(request);

        assertNotNull(response);
        assertEquals("Test Title", response.getTitle());
        assertEquals("Test Message", response.getMessage());
        assertEquals("TRIP_REMINDER", response.getType());
    }

    @Test
    void testGetUserNotifications_ReturnsOrderedByDate() {
        Notification notification1 = new Notification();
        notification1.setUser(testUser);
        Notification notification2 = new Notification();
        notification2.setUser(testUser);

        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(1L))
                .thenReturn(Arrays.asList(notification1, notification2));

        var notifications = notificationService.getUserNotifications(1L);

        assertNotNull(notifications);
        assertEquals(2, notifications.size());
    }

    @Test
    void testGetUnreadNotifications_ReturnsOnlyUnread() {
        Notification notification = new Notification();
        notification.setUser(testUser);

        when(notificationRepository.findByUserIdAndIsReadFalse(1L))
                .thenReturn(Arrays.asList(notification));

        var notifications = notificationService.getUnreadNotifications(1L);

        assertNotNull(notifications);
        assertEquals(1, notifications.size());
    }

    @Test
    void testGetUnreadCount_ReturnsCorrectCount() {
        when(notificationRepository.countByUserIdAndIsReadFalse(1L)).thenReturn(5L);

        long count = notificationService.getUnreadCount(1L);

        assertEquals(5L, count);
    }

    @Test
    void testMarkAsRead_Success() {
        Notification notification = new Notification();
        notification.setId(1L);
        notification.setUser(testUser);
        notification.setRead(false);

        when(notificationRepository.findById(1L)).thenReturn(Optional.of(notification));
        when(notificationRepository.save(any(Notification.class))).thenReturn(notification);

        var response = notificationService.markAsRead(1L, 1L);

        assertTrue(response.isRead());
    }

    @Test
    void testMarkAsRead_Unauthorized_ThrowsException() {
        Notification notification = new Notification();
        notification.setId(1L);
        notification.setUser(testUser);
        notification.setRead(false);

        when(notificationRepository.findById(1L)).thenReturn(Optional.of(notification));

        assertThrows(RuntimeException.class, () -> {
            notificationService.markAsRead(1L, 2L);
        });
    }

    @Test
    void testMarkAllAsRead_MarksAllUnread() {
        Notification notification1 = new Notification();
        notification1.setUser(testUser);
        notification1.setRead(false);

        Notification notification2 = new Notification();
        notification2.setUser(testUser);
        notification2.setRead(false);

        when(notificationRepository.findByUserIdAndIsReadFalse(1L))
                .thenReturn(Arrays.asList(notification1, notification2));

        notificationService.markAllAsRead(1L);

        verify(notificationRepository).saveAll(any());
    }

    @Test
    void testDeleteNotification_Success() {
        Notification notification = new Notification();
        notification.setId(1L);
        notification.setUser(testUser);

        when(notificationRepository.findById(1L)).thenReturn(Optional.of(notification));

        notificationService.deleteNotification(1L, 1L);

        verify(notificationRepository).delete(notification);
    }

    @Test
    void testDeleteNotification_Unauthorized_ThrowsException() {
        Notification notification = new Notification();
        notification.setId(1L);
        notification.setUser(testUser);

        when(notificationRepository.findById(1L)).thenReturn(Optional.of(notification));

        assertThrows(RuntimeException.class, () -> {
            notificationService.deleteNotification(1L, 2L);
        });

        verify(notificationRepository, never()).delete(any());
    }
}