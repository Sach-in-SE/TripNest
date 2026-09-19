package com.tripnest.service;

import com.tripnest.entity.*;
import com.tripnest.exception.ResourceNotFoundException;
import com.tripnest.repository.*;
import com.tripnest.service.storage.StorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminUserDeletionServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private TripRepository tripRepository;
    @Mock
    private ItineraryRepository itineraryRepository;
    @Mock
    private ActivityRepository activityRepository;
    @Mock
    private BudgetRepository budgetRepository;
    @Mock
    private ExpenseRepository expenseRepository;
    @Mock
    private DocumentRepository documentRepository;
    @Mock
    private TravelMemoryRepository travelMemoryRepository;
    @Mock
    private TravelMemoryImageRepository travelMemoryImageRepository;
    @Mock
    private GroupRepository groupRepository;
    @Mock
    private GroupMemberRepository groupMemberRepository;
    @Mock
    private GroupMessageRepository groupMessageRepository;
    @Mock
    private TripShareRepository tripShareRepository;
    @Mock
    private ContactMessageRepository contactMessageRepository;
    @Mock
    private FavoriteDestinationRepository favoriteDestinationRepository;
    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private NotificationPreferenceRepository notificationPreferenceRepository;
    @Mock
    private TravelPreferenceRepository travelPreferenceRepository;
    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock
    private StorageService storageService;

    @InjectMocks
    private AdminUserService adminUserService;

    private User sampleTraveler;
    private User sampleAdmin;
    private Role travelerRole;
    private Role adminRole;

    @BeforeEach
    void setUp() {
        travelerRole = new Role();
        travelerRole.setName(ERole.ROLE_TRAVELER);

        adminRole = new Role();
        adminRole.setName(ERole.ROLE_ADMIN);

        sampleTraveler = new User();
        sampleTraveler.setId(10L);
        sampleTraveler.setUsername("traveler_sam");
        sampleTraveler.setEmail("sam@example.com");
        sampleTraveler.setRoles(new HashSet<>(Set.of(travelerRole)));

        sampleAdmin = new User();
        sampleAdmin.setId(2L);
        sampleAdmin.setUsername("super_admin_2");
        sampleAdmin.setEmail("admin2@example.com");
        sampleAdmin.setRoles(new HashSet<>(Set.of(adminRole)));
    }

    @Test
    void deleteUser_ShouldSucceedAndCascadeCleanup_ForTraveler() throws IOException {
        Long targetUserId = 10L;
        Long currentAdminId = 1L;

        when(userRepository.findByIdWithRoles(targetUserId)).thenReturn(Optional.of(sampleTraveler));

        // Mock Travel Memories
        TravelMemory memory = new TravelMemory();
        memory.setId(100L);
        memory.setStoredFileName("main_photo.jpg");
        TravelMemoryImage img = new TravelMemoryImage();
        img.setStoredFileName("child_photo.png");
        memory.setImages(new ArrayList<>(List.of(img)));
        when(travelMemoryRepository.findByUserIdOrderByCreatedAtDesc(targetUserId))
                .thenReturn(List.of(memory));

        // Mock Travel Documents
        TravelDocument doc = new TravelDocument();
        doc.setId(200L);
        doc.setStoredFileName("passport_copy.pdf");
        when(documentRepository.findByUserId(targetUserId)).thenReturn(List.of(doc));

        // Mock Trips
        Trip trip = new Trip();
        trip.setId(300L);
        when(tripRepository.findByUserId(targetUserId)).thenReturn(List.of(trip));

        TravelDocument tripDoc = new TravelDocument();
        tripDoc.setId(201L);
        tripDoc.setFileUrl("https://storage.azure.com/docs/ticket.pdf");
        when(documentRepository.findByTripId(300L)).thenReturn(List.of(tripDoc));

        Itinerary itinerary = new Itinerary();
        itinerary.setId(400L);
        when(itineraryRepository.findByTripIdOrderByDateAsc(300L)).thenReturn(List.of(itinerary));

        TravelPreference pref = new TravelPreference();
        when(travelPreferenceRepository.findByUserId(targetUserId)).thenReturn(Optional.of(pref));

        NotificationPreference notifPref = new NotificationPreference();
        when(notificationPreferenceRepository.findByUserId(targetUserId)).thenReturn(Optional.of(notifPref));

        // Act
        adminUserService.deleteUser(targetUserId, currentAdminId);

        // Assert - Physical Storage Files Deleted
        verify(storageService).deleteFile("main_photo.jpg");
        verify(storageService).deleteFile("child_photo.png");
        verify(storageService).deleteFile("passport_copy.pdf");
        verify(storageService).deleteFile("ticket.pdf");

        // Assert - Memories and Docs Deleted
        verify(travelMemoryRepository).deleteAll(List.of(memory));
        verify(documentRepository).deleteAll(List.of(doc));
        verify(documentRepository).deleteAll(List.of(tripDoc));

        // Assert - Trip and its components deleted
        verify(travelMemoryRepository).nullifyTripReferences(300L);
        verify(expenseRepository).deleteByTripId(300L);
        verify(budgetRepository).deleteByTripId(300L);
        verify(activityRepository).deleteByItineraryId(400L);
        verify(itineraryRepository).deleteAll(List.of(itinerary));
        verify(tripRepository).delete(trip);

        // Assert - User activities, itineraries, expenses, shares
        verify(activityRepository).deleteByUserId(targetUserId);
        verify(itineraryRepository).deleteByUserId(targetUserId);
        verify(expenseRepository).deleteByUserId(targetUserId);
        verify(tripShareRepository).deleteByUserId(targetUserId);

        // Assert - Groups & Messages
        verify(groupMessageRepository).deleteBySenderId(targetUserId);
        verify(groupMemberRepository).nullifyInviterReferences(targetUserId);
        verify(groupMemberRepository).deleteByUserId(targetUserId);
        verify(groupRepository).deleteGroupMemberJoinTableByUserId(targetUserId);

        // Assert - Contact messages nullified
        verify(contactMessageRepository).nullifyUserReferences(targetUserId);

        // Assert - Preferences & Tokens
        verify(travelPreferenceRepository).delete(pref);
        verify(notificationPreferenceRepository).delete(notifPref);
        verify(notificationRepository).deleteByUserId(targetUserId);
        verify(favoriteDestinationRepository).deleteByUserId(targetUserId);
        verify(passwordResetTokenRepository).deleteByUserId(targetUserId);

        // Assert - User deleted
        verify(userRepository).saveAndFlush(sampleTraveler);
        verify(userRepository).delete(sampleTraveler);
    }

    @Test
    void deleteUser_ShouldRejectSelfDeletion() {
        Long adminId = 1L;

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                adminUserService.deleteUser(adminId, adminId));

        assertEquals("Administrators cannot delete their own account", ex.getMessage());
        verifyNoInteractions(userRepository);
    }

    @Test
    void deleteUser_ShouldRejectDeletionOfOtherAdmin() {
        Long targetAdminId = 2L;
        Long currentAdminId = 1L;

        when(userRepository.findByIdWithRoles(targetAdminId)).thenReturn(Optional.of(sampleAdmin));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                adminUserService.deleteUser(targetAdminId, currentAdminId));

        assertEquals("Administrators cannot delete other administrator accounts", ex.getMessage());
        verify(userRepository, never()).delete(any());
    }

    @Test
    void deleteUser_ShouldThrowNotFound_WhenUserDoesNotExist() {
        Long targetId = 999L;
        Long currentAdminId = 1L;

        when(userRepository.findByIdWithRoles(targetId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                adminUserService.deleteUser(targetId, currentAdminId));

        verify(userRepository, never()).delete(any());
    }
}
