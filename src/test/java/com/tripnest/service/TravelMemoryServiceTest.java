package com.tripnest.service;

import com.tripnest.dto.TravelMemoryRequest;
import com.tripnest.dto.TravelMemoryResponse;
import com.tripnest.entity.*;
import com.tripnest.exception.ResourceNotFoundException;
import com.tripnest.repository.DestinationRepository;
import com.tripnest.repository.GroupRepository;
import com.tripnest.repository.TravelMemoryImageRepository;
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
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
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
    private TravelMemoryImageRepository travelMemoryImageRepository;

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

    @Test
    @DisplayName("Get Top 3 Public Memories by Destination - Returns only Public Memories")
    void testGetTop3PublicMemoriesByDestination() {
        publicMemory.setDestination(destination);
        when(travelMemoryRepository.findTop3ByDestinationIdAndVisibilityOrderByCreatedAtDesc(100L, MemoryVisibility.PUBLIC))
                .thenReturn(List.of(publicMemory));

        List<TravelMemoryResponse> res = travelMemoryService.getTop3PublicMemoriesByDestination(100L);

        assertEquals(1, res.size());
        assertEquals("Manali Snow Peaks", res.get(0).getTitle());
        assertEquals("PUBLIC", res.get(0).getVisibility());
        assertEquals("Goa", res.get(0).getDestinationName());
    }

    @Test
    @DisplayName("Get Top 3 Public Memories - Empty if Destination ID is null")
    void testGetTop3PublicMemoriesByDestination_NullId() {
        List<TravelMemoryResponse> res = travelMemoryService.getTop3PublicMemoriesByDestination(null);
        assertTrue(res.isEmpty());
        verifyNoInteractions(travelMemoryRepository);
    }

    @Test
    @DisplayName("Get Paginated Public Memories by Destination - Returns Page of Responses")
    void testGetPublicMemoriesByDestination_Paginated() {
        publicMemory.setDestination(destination);
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 10);
        org.springframework.data.domain.Page<TravelMemory> page = new org.springframework.data.domain.PageImpl<>(
                List.of(publicMemory), pageable, 1
        );

        when(travelMemoryRepository.findByDestinationIdAndVisibilityOrderByCreatedAtDesc(100L, MemoryVisibility.PUBLIC, pageable))
                .thenReturn(page);

        org.springframework.data.domain.Page<TravelMemoryResponse> res = travelMemoryService.getPublicMemoriesByDestination(100L, pageable);

        assertNotNull(res);
        assertEquals(1, res.getTotalElements());
        assertEquals("Manali Snow Peaks", res.getContent().get(0).getTitle());
    }

    @Test
    @DisplayName("Create Memory - Multiple Images (3) Success with Correct Ordering and Cover")
    void testCreateMemory_MultipleImages_Success() throws IOException {
        MockMultipartFile file1 = new MockMultipartFile("photos", "img1.jpg", "image/jpeg", new byte[]{1, 2, 3});
        MockMultipartFile file2 = new MockMultipartFile("photos", "img2.png", "image/png", new byte[]{4, 5, 6});
        MockMultipartFile file3 = new MockMultipartFile("photos", "img3.jpg", "image/jpeg", new byte[]{7, 8, 9});
        List<MultipartFile> files = List.of(file1, file2, file3);

        TravelMemoryRequest request = new TravelMemoryRequest();
        request.setTitle("Multi-photo trip memory");
        request.setVisibility("PUBLIC");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(travelMemoryRepository.save(any(TravelMemory.class))).thenAnswer(inv -> {
            TravelMemory m = inv.getArgument(0);
            m.setId(101L);
            return m;
        });

        TravelMemoryResponse res = travelMemoryService.createMemory(files, request, 1L);

        assertNotNull(res);
        assertEquals("Multi-photo trip memory", res.getTitle());
        assertNotNull(res.getImages());
        assertEquals(3, res.getImages().size());
        assertEquals(0, res.getImages().get(0).getDisplayOrder());
        assertEquals(1, res.getImages().get(1).getDisplayOrder());
        assertEquals(2, res.getImages().get(2).getDisplayOrder());

        // Cover image should match images[0]
        assertEquals(res.getImages().get(0).getFileUrl(), res.getImageUrl());
        assertEquals(res.getImages().get(0).getStoredFileName(), res.getStoredFileName());

        verify(documentFileValidator, times(3)).validateImageFile(any(MultipartFile.class));
        verify(storageService, times(3)).storeFile(any(MultipartFile.class), anyString());
    }

    @Test
    @DisplayName("Create Memory - Five Images (Maximum Boundary) Success")
    void testCreateMemory_FiveImages_Success() throws IOException {
        List<MultipartFile> files = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            files.add(new MockMultipartFile("photos", "img" + i + ".jpg", "image/jpeg", new byte[]{1, 2}));
        }

        TravelMemoryRequest request = new TravelMemoryRequest();
        request.setTitle("Max 5 photos memory");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(travelMemoryRepository.save(any(TravelMemory.class))).thenAnswer(inv -> inv.getArgument(0));

        TravelMemoryResponse res = travelMemoryService.createMemory(files, request, 1L);

        assertNotNull(res);
        assertEquals(5, res.getImages().size());
        for (int i = 0; i < 5; i++) {
            assertEquals(i, res.getImages().get(i).getDisplayOrder());
        }
        verify(storageService, times(5)).storeFile(any(MultipartFile.class), anyString());
    }

    @Test
    @DisplayName("Create Memory - Zero Images Rejected with Bad Request")
    void testCreateMemory_ZeroImages_Rejected() {
        TravelMemoryRequest request = new TravelMemoryRequest();
        request.setTitle("No photos");

        assertThrows(IllegalArgumentException.class, () -> travelMemoryService.createMemory(Collections.emptyList(), request, 1L));
        assertThrows(IllegalArgumentException.class, () -> travelMemoryService.createMemory((List<MultipartFile>) null, request, 1L));
    }

    @Test
    @DisplayName("Create Memory - Six Images (>5 Limit) Rejected with Bad Request")
    void testCreateMemory_SixImages_Rejected() {
        List<MultipartFile> files = new ArrayList<>();
        for (int i = 0; i < 6; i++) {
            files.add(new MockMultipartFile("photos", "img" + i + ".jpg", "image/jpeg", new byte[]{1}));
        }

        TravelMemoryRequest request = new TravelMemoryRequest();
        request.setTitle("Too many photos");

        assertThrows(IllegalArgumentException.class, () -> travelMemoryService.createMemory(files, request, 1L));
        verifyNoInteractions(storageService);
    }

    @Test
    @DisplayName("Create Memory - Invalid File in Batch Fails Entire Upload Atomically")
    void testCreateMemory_InvalidFileInBatch_AtomicFailure() {
        MockMultipartFile valid1 = new MockMultipartFile("photos", "good1.jpg", "image/jpeg", new byte[]{1});
        MockMultipartFile bad2 = new MockMultipartFile("photos", "script.exe", "application/x-msdownload", new byte[]{2});
        MockMultipartFile valid3 = new MockMultipartFile("photos", "good2.jpg", "image/jpeg", new byte[]{3});

        doAnswer(invocation -> {
            MultipartFile f = invocation.getArgument(0);
            if (f == bad2) {
                throw new IllegalArgumentException("Unsupported image format");
            }
            return null;
        }).when(documentFileValidator).validateImageFile(any());

        TravelMemoryRequest request = new TravelMemoryRequest();
        request.setTitle("Bad batch");

        assertThrows(IllegalArgumentException.class, () -> travelMemoryService.createMemory(List.of(valid1, bad2, valid3), request, 1L));
        verifyNoInteractions(storageService);
    }

    @Test
    @DisplayName("Create Memory - Storage Failure Cleans Up Already Stored Files")
    void testCreateMemory_StorageFailure_CleansUpOrphans() throws IOException {
        MockMultipartFile file1 = new MockMultipartFile("photos", "img1.jpg", "image/jpeg", new byte[]{1});
        MockMultipartFile file2 = new MockMultipartFile("photos", "img2.jpg", "image/jpeg", new byte[]{2});
        MockMultipartFile file3 = new MockMultipartFile("photos", "img3.jpg", "image/jpeg", new byte[]{3});

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(storageService.storeFile(eq(file1), anyString())).thenReturn("memory_1.jpg");
        when(storageService.storeFile(eq(file2), anyString())).thenReturn("memory_2.jpg");
        when(storageService.storeFile(eq(file3), anyString())).thenThrow(new IOException("Disk quota exceeded"));

        TravelMemoryRequest request = new TravelMemoryRequest();
        request.setTitle("Storage failure test");

        assertThrows(IOException.class, () -> travelMemoryService.createMemory(List.of(file1, file2, file3), request, 1L));

        // Files 1 and 2 should be deleted to prevent orphans
        verify(storageService, times(2)).deleteFile(anyString());
        verify(travelMemoryRepository, never()).save(any());
    }

    @Test
    @DisplayName("Delete Memory - Multi-Image Memory Cleans Up All Child Physical Files")
    void testDeleteMemory_MultiImage_CleansAllFiles() throws IOException {
        TravelMemory multiMem = new TravelMemory();
        multiMem.setId(77L);
        multiMem.setUser(user);
        multiMem.setStoredFileName("memory_cover.jpg");

        TravelMemoryImage img1 = new TravelMemoryImage();
        img1.setStoredFileName("memory_cover.jpg");
        TravelMemoryImage img2 = new TravelMemoryImage();
        img2.setStoredFileName("memory_second.jpg");
        TravelMemoryImage img3 = new TravelMemoryImage();
        img3.setStoredFileName("memory_third.jpg");
        multiMem.setImages(new ArrayList<>(List.of(img1, img2, img3)));

        when(travelMemoryRepository.findById(77L)).thenReturn(Optional.of(multiMem));

        travelMemoryService.deleteMemory(77L, 1L);

        verify(storageService).deleteFile("memory_cover.jpg");
        verify(storageService).deleteFile("memory_second.jpg");
        verify(storageService).deleteFile("memory_third.jpg");
        verify(travelMemoryRepository).delete(multiMem);
    }

    @Test
    @DisplayName("Get Photo Resource - Nonexistent File Throws 404 Fail-Close (Never Accesses Disk)")
    void testGetPhotoResource_Nonexistent_Throws404FailClose() throws IOException {
        when(travelMemoryImageRepository.findByStoredFileName("ghost_file.jpg")).thenReturn(Optional.empty());
        when(travelMemoryRepository.findByStoredFileName("ghost_file.jpg")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> travelMemoryService.getMemoryPhotoResource("ghost_file.jpg", 1L));

        // Storage MUST NEVER be touched when file is unassociated with any DB memory!
        verify(storageService, never()).loadFileAsResource(anyString());
    }

    @Test
    @DisplayName("Get Photo Resource - Child Image in Private Memory Denies Non-Owner")
    void testGetPhotoResource_ChildImage_PrivateDenied() {
        TravelMemoryImage childImg = new TravelMemoryImage();
        childImg.setStoredFileName("memory_child.jpg");
        childImg.setTravelMemory(privateMemory); // privateMemory owned by user 1

        when(travelMemoryImageRepository.findByStoredFileName("memory_child.jpg")).thenReturn(Optional.of(childImg));

        assertThrows(AccessDeniedException.class, () -> travelMemoryService.getMemoryPhotoResource("memory_child.jpg", 2L));
        assertThrows(AccessDeniedException.class, () -> travelMemoryService.getMemoryPhotoResource("memory_child.jpg", null));
    }

    @Test
    @DisplayName("Get Photo Resource - Child Image in Private Memory Allows Owner")
    void testGetPhotoResource_ChildImage_PrivateAllowedForOwner() throws IOException {
        TravelMemoryImage childImg = new TravelMemoryImage();
        childImg.setStoredFileName("memory_child.jpg");
        childImg.setTravelMemory(privateMemory);

        when(travelMemoryImageRepository.findByStoredFileName("memory_child.jpg")).thenReturn(Optional.of(childImg));
        Resource mockResource = new ByteArrayResource(new byte[]{1});
        when(storageService.loadFileAsResource("memory_child.jpg")).thenReturn(mockResource);

        Resource res = travelMemoryService.getMemoryPhotoResource("memory_child.jpg", 1L);
        assertNotNull(res);
        verify(storageService).loadFileAsResource("memory_child.jpg");
    }

    @Test
    @DisplayName("Get Photo Resource - Child Image in Public Memory Accessible to Any User")
    void testGetPhotoResource_ChildImage_PublicAllowed() throws IOException {
        TravelMemoryImage childImg = new TravelMemoryImage();
        childImg.setStoredFileName("memory_child_pub.jpg");
        childImg.setTravelMemory(publicMemory);

        when(travelMemoryImageRepository.findByStoredFileName("memory_child_pub.jpg")).thenReturn(Optional.of(childImg));
        Resource mockResource = new ByteArrayResource(new byte[]{1, 2});
        when(storageService.loadFileAsResource("memory_child_pub.jpg")).thenReturn(mockResource);

        // Accessible anonymously
        Resource resAnon = travelMemoryService.getMemoryPhotoResource("memory_child_pub.jpg", null);
        assertNotNull(resAnon);

        // Accessible to other users
        Resource resOther = travelMemoryService.getMemoryPhotoResource("memory_child_pub.jpg", 2L);
        assertNotNull(resOther);

        verify(storageService, times(2)).loadFileAsResource("memory_child_pub.jpg");
    }

    @Test
    @DisplayName("Backward Compatibility - Legacy Memory with No Child Records Maps Fallback Cover Image")
    void testLegacyMemoryMapping_FallbackPopulated() {
        when(travelMemoryRepository.findById(50L)).thenReturn(Optional.of(privateMemory));

        TravelMemoryResponse res = travelMemoryService.getMemoryById(50L, 1L);

        assertNotNull(res);
        assertEquals("/api/memories/photo/memory_12345.jpg", res.getImageUrl());
        assertEquals("memory_12345.jpg", res.getStoredFileName());
        assertNotNull(res.getImages());
        assertEquals(1, res.getImages().size());
        assertEquals("/api/memories/photo/memory_12345.jpg", res.getImages().get(0).getFileUrl());
        assertEquals("/api/memories/photo/memory_12345.jpg", res.getImages().get(0).getImageUrl());
        assertEquals("memory_12345.jpg", res.getImages().get(0).getStoredFileName());
        assertEquals(0, res.getImages().get(0).getDisplayOrder());
    }
}
