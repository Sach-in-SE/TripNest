package com.tripnest.service;

import com.tripnest.dto.TravelMemoryRequest;
import com.tripnest.dto.TravelMemoryResponse;
import com.tripnest.entity.*;
import com.tripnest.repository.DestinationRepository;
import com.tripnest.repository.GroupRepository;
import com.tripnest.repository.TravelMemoryRepository;
import com.tripnest.repository.TripRepository;
import com.tripnest.repository.UserRepository;
import com.tripnest.service.storage.DocumentFileValidator;
import com.tripnest.service.storage.StorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TravelMemoryServiceTest {

    @Mock
    private TravelMemoryRepository travelMemoryRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TripRepository tripRepository;

    @Mock
    private DestinationRepository destinationRepository;

    @Mock
    private TripShareService tripShareService;

    @Mock
    private GroupRepository groupRepository;

    @Mock
    private StorageService storageService;

    @Mock
    private DocumentFileValidator documentFileValidator;

    @InjectMocks
    private TravelMemoryService travelMemoryService;

    private User user;
    private User otherUser;
    private Trip trip;
    private Destination destination;
    private TravelMemory privateMemory;
    private TravelMemory publicMemory;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setUsername("traveler1");
        user.setFirstName("Alice");
        user.setLastName("Wonderland");

        otherUser = new User();
        otherUser.setId(2L);
        otherUser.setUsername("traveler2");

        trip = new Trip();
        trip.setId(10L);
        trip.setTitle("Goa Summer Vacation");
        trip.setUser(user);

        destination = new Destination();
        destination.setId(100L);
        destination.setName("Goa");

        privateMemory = new TravelMemory();
        privateMemory.setId(50L);
        privateMemory.setTitle("Sunset at Baga Beach");
        privateMemory.setCaption("Magical golden hour sunset!");
        privateMemory.setLocationName("Baga, Goa");
        privateMemory.setStoredFileName("memory_12345.jpg");
        privateMemory.setImageUrl("/api/memories/photo/memory_12345.jpg");
        privateMemory.setVisibility(MemoryVisibility.PRIVATE);
        privateMemory.setUser(user);
        privateMemory.setTrip(trip);
        privateMemory.setDestination(destination);
        privateMemory.setCreatedAt(LocalDateTime.now());
        privateMemory.setUpdatedAt(LocalDateTime.now());

        publicMemory = new TravelMemory();
        publicMemory.setId(51L);
        publicMemory.setTitle("Manali Snow Peaks");
        publicMemory.setCaption("Crisp morning breeze");
        publicMemory.setLocationName("Solang Valley");
        publicMemory.setStoredFileName("memory_67890.png");
        publicMemory.setImageUrl("/api/memories/photo/memory_67890.png");
        publicMemory.setVisibility(MemoryVisibility.PUBLIC);
        publicMemory.setUser(user);
        publicMemory.setCreatedAt(LocalDateTime.now());
        publicMemory.setUpdatedAt(LocalDateTime.now());
    }

    @Test
    @DisplayName("Create Memory - Success for Authenticated User")
    void testCreateMemory_Success() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "photo", "sunset.jpg", "image/jpeg", new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x00}
        );

        TravelMemoryRequest request = new TravelMemoryRequest();
        request.setTitle("Sunset at Baga Beach");
        request.setCaption("Golden sunset vibes");
        request.setLocationName("Baga Beach");
        request.setTripId(10L);
        request.setDestinationId(100L);
        request.setVisibility("PUBLIC");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(tripRepository.findById(10L)).thenReturn(Optional.of(trip));
        when(destinationRepository.findById(100L)).thenReturn(Optional.of(destination));
        when(travelMemoryRepository.save(any(TravelMemory.class))).thenAnswer(invocation -> {
            TravelMemory m = invocation.getArgument(0);
            m.setId(99L);
            return m;
        });

        TravelMemoryResponse res = travelMemoryService.createMemory(file, request, 1L);

        assertNotNull(res);
        assertEquals("Sunset at Baga Beach", res.getTitle());
        assertEquals("PUBLIC", res.getVisibility());
        assertEquals("Goa Summer Vacation", res.getTripTitle());
        assertEquals("Goa", res.getDestinationName());
        assertTrue(res.isOwner());

        verify(documentFileValidator).validateImageFile(file);
        verify(storageService).storeFile(eq(file), anyString());
        verify(travelMemoryRepository).save(any(TravelMemory.class));
    }

    @Test
    @DisplayName("Create Memory - Rejects Unauthorized Trip Association")
    void testCreateMemory_UnauthorizedTrip() {
        MockMultipartFile file = new MockMultipartFile(
                "photo", "sunset.jpg", "image/jpeg", new byte[]{1, 2, 3}
        );

        Trip otherTrip = new Trip();
        otherTrip.setId(999L);
        otherTrip.setUser(otherUser);

        TravelMemoryRequest request = new TravelMemoryRequest();
        request.setTitle("Unauthorized Trip Memory");
        request.setTripId(999L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(tripRepository.findById(999L)).thenReturn(Optional.of(otherTrip));
        when(tripShareService.hasAccess(999L, 1L)).thenReturn(false);
        when(groupRepository.existsByTripIdAndMembersId(999L, 1L)).thenReturn(false);

        assertThrows(AccessDeniedException.class, () -> travelMemoryService.createMemory(file, request, 1L));
    }

    @Test
    @DisplayName("Get User Memories - Returns Only Authenticated User's Memories")
    void testGetUserMemories() {
        when(travelMemoryRepository.findByUserIdOrderByCreatedAtDesc(1L))
                .thenReturn(Arrays.asList(privateMemory, publicMemory));

        List<TravelMemoryResponse> list = travelMemoryService.getUserMemories(1L);

        assertEquals(2, list.size());
        assertTrue(list.get(0).isOwner());
        assertTrue(list.get(1).isOwner());
    }

    @Test
    @DisplayName("Get Public Memories - Returns Only Public Memories with Correct Ownership Flags")
    void testGetPublicMemories() {
        when(travelMemoryRepository.findByVisibilityOrderByCreatedAtDesc(MemoryVisibility.PUBLIC))
                .thenReturn(List.of(publicMemory));

        // When viewed by Alice (owner)
        List<TravelMemoryResponse> listAsOwner = travelMemoryService.getPublicMemories(1L);
        assertEquals(1, listAsOwner.size());
        assertTrue(listAsOwner.get(0).isOwner());

        // When viewed by unauthenticated or another user
        List<TravelMemoryResponse> listAsOther = travelMemoryService.getPublicMemories(2L);
        assertEquals(1, listAsOther.size());
        assertFalse(listAsOther.get(0).isOwner());
    }

    @Test
    @DisplayName("Get Memory by ID - Allows Owner for Private Memory")
    void testGetMemoryById_PrivateAllowedForOwner() {
        when(travelMemoryRepository.findById(50L)).thenReturn(Optional.of(privateMemory));

        TravelMemoryResponse res = travelMemoryService.getMemoryById(50L, 1L);
        assertNotNull(res);
        assertEquals("Sunset at Baga Beach", res.getTitle());
    }

    @Test
    @DisplayName("Get Memory by ID - Denies Non-Owner for Private Memory (Isolation)")
    void testGetMemoryById_PrivateDeniedForOtherUser() {
        when(travelMemoryRepository.findById(50L)).thenReturn(Optional.of(privateMemory));

        assertThrows(AccessDeniedException.class, () -> travelMemoryService.getMemoryById(50L, 2L));
        assertThrows(AccessDeniedException.class, () -> travelMemoryService.getMemoryById(50L, null));
    }

    @Test
    @DisplayName("Get Memory by ID - Allows Any User for Public Memory")
    void testGetMemoryById_PublicAllowedForAnyone() {
        when(travelMemoryRepository.findById(51L)).thenReturn(Optional.of(publicMemory));

        TravelMemoryResponse resAnon = travelMemoryService.getMemoryById(51L, null);
        assertNotNull(resAnon);
        assertEquals("Manali Snow Peaks", resAnon.getTitle());
    }

    @Test
    @DisplayName("Update Memory - Allows Owner to Edit Metadata")
    void testUpdateMemory_SuccessForOwner() {
        when(travelMemoryRepository.findById(50L)).thenReturn(Optional.of(privateMemory));
        when(travelMemoryRepository.save(any(TravelMemory.class))).thenAnswer(inv -> inv.getArgument(0));

        TravelMemoryRequest updateReq = new TravelMemoryRequest();
        updateReq.setTitle("Updated Sunset Title");
        updateReq.setCaption("Updated Caption");
        updateReq.setVisibility("PUBLIC");

        TravelMemoryResponse res = travelMemoryService.updateMemory(50L, updateReq, 1L);
        assertEquals("Updated Sunset Title", res.getTitle());
        assertEquals("PUBLIC", res.getVisibility());
    }

    @Test
    @DisplayName("Update Memory - Rejects Non-Owner")
    void testUpdateMemory_DeniedForNonOwner() {
        when(travelMemoryRepository.findById(50L)).thenReturn(Optional.of(privateMemory));

        TravelMemoryRequest updateReq = new TravelMemoryRequest();
        updateReq.setTitle("Hacked Title");

        assertThrows(AccessDeniedException.class, () -> travelMemoryService.updateMemory(50L, updateReq, 2L));
    }

    @Test
    @DisplayName("Delete Memory - Success for Owner and Cleans Storage")
    void testDeleteMemory_SuccessForOwner() throws IOException {
        when(travelMemoryRepository.findById(50L)).thenReturn(Optional.of(privateMemory));

        travelMemoryService.deleteMemory(50L, 1L);

        verify(storageService).deleteFile("memory_12345.jpg");
        verify(travelMemoryRepository).delete(privateMemory);
    }

    @Test
    @DisplayName("Delete Memory - Rejects Non-Owner")
    void testDeleteMemory_DeniedForNonOwner() {
        when(travelMemoryRepository.findById(50L)).thenReturn(Optional.of(privateMemory));

        assertThrows(AccessDeniedException.class, () -> travelMemoryService.deleteMemory(50L, 2L));
    }

    @Test
    @DisplayName("Get Photo Resource - Protects Private Photos")
    void testGetPhotoResource_PrivateDenied() {
        when(travelMemoryRepository.findByStoredFileName("memory_12345.jpg")).thenReturn(Optional.of(privateMemory));

        assertThrows(AccessDeniedException.class, () -> travelMemoryService.getMemoryPhotoResource("memory_12345.jpg", 2L));
    }

    @Test
    @DisplayName("Get Photo Resource - Delivers Public Photos")
    void testGetPhotoResource_PublicAllowed() throws IOException {
        when(travelMemoryRepository.findByStoredFileName("memory_67890.png")).thenReturn(Optional.of(publicMemory));
        Resource mockResource = new ByteArrayResource(new byte[]{1, 2, 3});
        when(storageService.loadFileAsResource("memory_67890.png")).thenReturn(mockResource);

        Resource res = travelMemoryService.getMemoryPhotoResource("memory_67890.png", null);
        assertNotNull(res);
        verify(storageService).loadFileAsResource("memory_67890.png");
    }
}
