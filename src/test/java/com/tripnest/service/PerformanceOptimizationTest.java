package com.tripnest.service;

import com.tripnest.config.CacheConfig;
import com.tripnest.dto.ExpenseResponse;
import com.tripnest.dto.GroupMessageResponse;
import com.tripnest.dto.NotificationResponse;
import com.tripnest.dto.TravelMemoryResponse;
import com.tripnest.entity.*;
import com.tripnest.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.CacheManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PerformanceOptimizationTest {

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private TripRepository tripRepository;

    @Mock
    private TripShareService tripShareService;

    @Mock
    private GroupRepository groupRepository;

    @Mock
    private GroupMemberRepository groupMemberRepository;

    @Mock
    private GroupMessageRepository groupMessageRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private TravelMemoryRepository travelMemoryRepository;

    @InjectMocks
    private ExpenseService expenseService;

    @InjectMocks
    private GroupService groupService;

    @InjectMocks
    private NotificationService notificationService;

    @InjectMocks
    private TravelMemoryService travelMemoryService;

    private User testUser;
    private Trip testTrip;
    private TravelGroup testGroup;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(10L);
        testUser.setUsername("perfuser");
        testUser.setFirstName("Performance");
        testUser.setLastName("Tester");
        testUser.setEmail("perf@tripnest.com");

        testTrip = new Trip();
        testTrip.setId(100L);
        testTrip.setTitle("Euro Trip");
        testTrip.setUser(testUser);
        testTrip.setStartDate(LocalDate.now());
        testTrip.setEndDate(LocalDate.now().plusDays(7));

        testGroup = new TravelGroup();
        testGroup.setId(500L);
        testGroup.setName("Euro Travelers");
        testGroup.setCreatedBy(testUser);
        testGroup.setTrip(testTrip);
    }

    @Test
    @DisplayName("ExpenseService.getUserExpenses calls optimized single query findAccessibleExpensesByUserId")
    void testGetUserExpenses_CallsOptimizedQuery() {
        Expense expense = new Expense();
        expense.setId(1L);
        expense.setTitle("Lunch in Paris");
        expense.setAmount(45.0);
        expense.setDate(LocalDate.now());
        expense.setCategory(ExpenseCategory.FOOD);
        expense.setUser(testUser);
        expense.setTrip(testTrip);

        when(expenseRepository.findAccessibleExpensesByUserId(10L)).thenReturn(List.of(expense));

        List<ExpenseResponse> results = expenseService.getUserExpenses(10L);

        assertNotNull(results);
        assertEquals(1, results.size());
        assertEquals("Lunch in Paris", results.get(0).getTitle());
        assertEquals(45.0, results.get(0).getAmount());
        assertEquals("perfuser", results.get(0).getUsername());

        verify(expenseRepository).findAccessibleExpensesByUserId(10L);
        verify(expenseRepository, never()).findByTripId(anyLong());
    }

    @Test
    @DisplayName("ExpenseService.getTripExpenses uses findByTripIdWithUserAndTrip join fetch")
    void testGetTripExpenses_UsesJoinFetch() {
        when(tripRepository.findById(100L)).thenReturn(Optional.of(testTrip));

        Expense expense = new Expense();
        expense.setId(2L);
        expense.setTitle("Train Ticket");
        expense.setAmount(80.0);
        expense.setDate(LocalDate.now());
        expense.setCategory(ExpenseCategory.TRANSPORTATION);
        expense.setUser(testUser);
        expense.setTrip(testTrip);

        when(expenseRepository.findByTripIdWithUserAndTrip(100L)).thenReturn(List.of(expense));

        List<ExpenseResponse> results = expenseService.getTripExpenses(100L, 10L);

        assertNotNull(results);
        assertEquals(1, results.size());
        assertEquals("Train Ticket", results.get(0).getTitle());

        verify(expenseRepository).findByTripIdWithUserAndTrip(100L);
    }

    @Test
    @DisplayName("GroupService.getGroupMessages with beforeId delegates to cursor pagination")
    void testGetGroupMessages_WithBeforeIdCursor() {
        when(groupRepository.findByIdWithDetails(500L)).thenReturn(Optional.of(testGroup));

        GroupMessage msg = new GroupMessage();
        msg.setId(42L);
        msg.setContent("Older message content");
        msg.setSender(testUser);
        msg.setTravelGroup(testGroup);
        msg.setCreatedAt(LocalDateTime.now().minusHours(1));

        when(groupMessageRepository.findRecentByTravelGroupIdWithSender(eq(500L), eq(50L), any(Pageable.class)))
                .thenReturn(List.of(msg));

        List<GroupMessageResponse> responses = groupService.getGroupMessages(500L, 10L, 50L, 25);

        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals("Older message content", responses.get(0).getContent());
        assertEquals(42L, responses.get(0).getId());

        verify(groupMessageRepository).findRecentByTravelGroupIdWithSender(eq(500L), eq(50L), any(Pageable.class));
    }

    @Test
    @DisplayName("NotificationService.getUserNotifications with Pageable returns paged response")
    void testGetNotifications_Pageable() {
        Notification notif = new Notification();
        notif.setId(101L);
        notif.setTitle("Trip Reminder");
        notif.setMessage("Flight in 24 hours");
        notif.setType(NotificationType.TRIP_REMINDER);
        notif.setUser(testUser);
        notif.setCreatedAt(LocalDateTime.now());
        notif.setRead(false);

        Page<Notification> page = new PageImpl<>(List.of(notif), PageRequest.of(0, 10), 1);
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(eq(10L), any(Pageable.class)))
                .thenReturn(page);

        Page<NotificationResponse> resultPage = notificationService.getUserNotifications(10L, PageRequest.of(0, 10));

        assertNotNull(resultPage);
        assertEquals(1, resultPage.getTotalElements());
        assertEquals("Trip Reminder", resultPage.getContent().get(0).getTitle());

        verify(notificationRepository).findByUserIdOrderByCreatedAtDesc(eq(10L), any(Pageable.class));
    }

    @Test
    @DisplayName("TravelMemoryService.getUserMemories with Pageable returns paged memories")
    void testGetUserMemories_Pageable() {
        TravelMemory memory = new TravelMemory();
        memory.setId(201L);
        memory.setTitle("Sunset at Eiffel Tower");
        memory.setVisibility(MemoryVisibility.PUBLIC);
        memory.setUser(testUser);
        memory.setTrip(testTrip);
        memory.setImages(Collections.emptyList());
        memory.setCreatedAt(LocalDateTime.now());

        Page<TravelMemory> page = new PageImpl<>(List.of(memory), PageRequest.of(0, 10), 1);
        when(travelMemoryRepository.findByUserIdOrderByCreatedAtDesc(eq(10L), any(Pageable.class)))
                .thenReturn(page);

        Page<TravelMemoryResponse> resultPage = travelMemoryService.getUserMemories(10L, PageRequest.of(0, 10));

        assertNotNull(resultPage);
        assertEquals(1, resultPage.getTotalElements());
        assertEquals("Sunset at Eiffel Tower", resultPage.getContent().get(0).getTitle());

        verify(travelMemoryRepository).findByUserIdOrderByCreatedAtDesc(eq(10L), any(Pageable.class));
    }

    @Test
    @DisplayName("CacheConfig creates Caffeine cache manager with all required performance caches")
    void testCacheConfig_InitializesAllCaches() {
        CacheConfig cacheConfig = new CacheConfig();
        CacheManager cacheManager = cacheConfig.cacheManager();

        assertNotNull(cacheManager);
        assertNotNull(cacheManager.getCache("destinations"));
        assertNotNull(cacheManager.getCache("destinations-list"));
        assertNotNull(cacheManager.getCache("destination-image"));
        assertNotNull(cacheManager.getCache("weather"));
        assertNotNull(cacheManager.getCache("wikipedia"));
        assertNotNull(cacheManager.getCache("travel-guide"));
        assertNotNull(cacheManager.getCache("admin-stats"));
    }
}
