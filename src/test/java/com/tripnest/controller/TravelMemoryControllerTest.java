package com.tripnest.controller;

import com.tripnest.dto.TravelMemoryResponse;
import com.tripnest.service.TravelMemoryService;
import com.tripnest.tripnest.TripnestApplication;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.tripnest.dto.MemoryImageResponse;
import com.tripnest.entity.MemoryVisibility;
import com.tripnest.exception.ResourceNotFoundException;
import com.tripnest.security.UserDetailsImpl;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;

import java.util.Collections;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;

@SpringBootTest(classes = TripnestApplication.class)
@AutoConfigureMockMvc
public class TravelMemoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TravelMemoryService travelMemoryService;

    @Test
    @DisplayName("GET /api/memories/public - Public access without authentication")
    void testGetPublicMemories_PermitAll() throws Exception {
        TravelMemoryResponse res = new TravelMemoryResponse();
        res.setId(101L);
        res.setTitle("Public View of Taj Mahal");
        res.setVisibility("PUBLIC");
        res.setCreatedAt(LocalDateTime.now());

        when(travelMemoryService.getPublicMemories(any())).thenReturn(List.of(res));

        mockMvc.perform(get("/api/memories/public"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Public View of Taj Mahal"))
                .andExpect(jsonPath("$[0].visibility").value("PUBLIC"));
    }

    @Test
    @DisplayName("GET /api/memories/photo/{fileName} - Public photo serving with cachePublic")
    void testGetPhoto_PermitAll() throws Exception {
        ByteArrayResource imageResource = new ByteArrayResource(new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x00});
        when(travelMemoryService.getMemoryPhotoResource(eq("public_photo.jpg"), any())).thenReturn(imageResource);
        when(travelMemoryService.getPhotoVisibility("public_photo.jpg")).thenReturn(MemoryVisibility.PUBLIC);

        mockMvc.perform(get("/api/memories/photo/public_photo.jpg"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", MediaType.IMAGE_JPEG_VALUE))
                .andExpect(header().string("Cache-Control", org.hamcrest.Matchers.containsString("public")));
    }

    @Test
    @DisplayName("GET /api/memories/photo/{fileName} - Private photo serving uses safe private cache")
    void testGetPhoto_PrivateUsesPrivateCache() throws Exception {
        ByteArrayResource imageResource = new ByteArrayResource(new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x00});
        when(travelMemoryService.getMemoryPhotoResource(eq("private_photo.jpg"), any())).thenReturn(imageResource);
        when(travelMemoryService.getPhotoVisibility("private_photo.jpg")).thenReturn(MemoryVisibility.PRIVATE);

        mockMvc.perform(get("/api/memories/photo/private_photo.jpg"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", org.hamcrest.Matchers.containsString("no-cache")));
    }

    @Test
    @DisplayName("GET /api/memories/photo/{fileName} - Unauthenticated private photo access denied (403)")
    void testGetPhoto_Private_Unauthenticated_Denied() throws Exception {
        when(travelMemoryService.getMemoryPhotoResource(eq("secret.jpg"), isNull()))
                .thenThrow(new AccessDeniedException("Unauthorized: This travel photo is private."));

        mockMvc.perform(get("/api/memories/photo/secret.jpg"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Unauthorized: This travel photo is private."));
    }

    @Test
    @DisplayName("GET /api/memories/photo/{fileName} - Non-owner private photo access denied (403)")
    void testGetPhoto_Private_NonOwner_Denied() throws Exception {
        UserDetailsImpl otherUser = new UserDetailsImpl(2L, "other", "other@test.com", "pass", Collections.emptyList());
        when(travelMemoryService.getMemoryPhotoResource(eq("secret.jpg"), eq(2L)))
                .thenThrow(new AccessDeniedException("Unauthorized: This travel photo is private."));

        mockMvc.perform(get("/api/memories/photo/secret.jpg")
                        .with(user(otherUser)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Unauthorized: This travel photo is private."));
    }

    @Test
    @DisplayName("GET /api/memories/photo/{fileName} - Owner private photo access allowed (200)")
    void testGetPhoto_Private_Owner_Allowed() throws Exception {
        UserDetailsImpl owner = new UserDetailsImpl(1L, "owner", "owner@test.com", "pass", Collections.emptyList());
        ByteArrayResource imageResource = new ByteArrayResource(new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x00});
        when(travelMemoryService.getMemoryPhotoResource(eq("secret.jpg"), eq(1L))).thenReturn(imageResource);
        when(travelMemoryService.getPhotoVisibility("secret.jpg")).thenReturn(MemoryVisibility.PRIVATE);

        mockMvc.perform(get("/api/memories/photo/secret.jpg")
                        .with(user(owner)))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", org.hamcrest.Matchers.containsString("no-cache")));
    }

    @Test
    @DisplayName("GET /api/memories/photo/{fileName} - Nonexistent photo returns 404 Not Found")
    void testGetPhoto_NotFound_Returns404() throws Exception {
        when(travelMemoryService.getMemoryPhotoResource(eq("missing.jpg"), any()))
                .thenThrow(new ResourceNotFoundException("Photo not found"));

        mockMvc.perform(get("/api/memories/photo/missing.jpg"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/memories - Unauthorized without token")
    void testGetUserMemories_Unauthorized() throws Exception {
        mockMvc.perform(get("/api/memories"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/memories - Unauthorized without token")
    void testCreateMemory_Unauthorized() throws Exception {
        mockMvc.perform(multipart("/api/memories")
                        .file("photo", new byte[]{1, 2, 3})
                        .param("title", "My Sunset"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/memories - Multi-Image (3 photos) Creation Success")
    void testCreateMemory_MultiplePhotos_Success() throws Exception {
        UserDetailsImpl userDetails = new UserDetailsImpl(1L, "traveler", "traveler@test.com", "pass", Collections.emptyList());
        MockMultipartFile file1 = new MockMultipartFile("photos", "photo1.jpg", "image/jpeg", new byte[]{1, 2});
        MockMultipartFile file2 = new MockMultipartFile("photos", "photo2.jpg", "image/jpeg", new byte[]{3, 4});

        TravelMemoryResponse res = new TravelMemoryResponse();
        res.setId(200L);
        res.setTitle("Multi Photo Vacation");
        res.setImageUrl("/api/memories/photo/memory_1.jpg");
        res.setImages(List.of(
                MemoryImageResponse.builder().id(1L).fileUrl("/api/memories/photo/memory_1.jpg").displayOrder(0).build(),
                MemoryImageResponse.builder().id(2L).fileUrl("/api/memories/photo/memory_2.jpg").displayOrder(1).build()
        ));

        when(travelMemoryService.createMemory(anyList(), any(), eq(1L))).thenReturn(res);

        mockMvc.perform(multipart("/api/memories")
                        .file(file1)
                        .file(file2)
                        .param("title", "Multi Photo Vacation")
                        .with(user(userDetails)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(200))
                .andExpect(jsonPath("$.title").value("Multi Photo Vacation"))
                .andExpect(jsonPath("$.images.length()").value(2));
    }

    @Test
    @DisplayName("POST /api/memories - Multi-Image (photos[] bracket notation) Creation Success")
    void testCreateMemory_MultiplePhotosBracket_Success() throws Exception {
        UserDetailsImpl userDetails = new UserDetailsImpl(1L, "traveler", "traveler@test.com", "pass", Collections.emptyList());
        MockMultipartFile file1 = new MockMultipartFile("photos[]", "photo1.jpg", "image/jpeg", new byte[]{1, 2});
        MockMultipartFile file2 = new MockMultipartFile("photos[]", "photo2.jpg", "image/jpeg", new byte[]{3, 4});

        TravelMemoryResponse res = new TravelMemoryResponse();
        res.setId(205L);
        res.setTitle("Bracket Photos Vacation");
        res.setImageUrl("/api/memories/photo/memory_b1.jpg");
        res.setImages(List.of(
                MemoryImageResponse.builder().id(10L).imageUrl("/api/memories/photo/memory_b1.jpg").fileUrl("/api/memories/photo/memory_b1.jpg").displayOrder(0).build(),
                MemoryImageResponse.builder().id(11L).imageUrl("/api/memories/photo/memory_b2.jpg").fileUrl("/api/memories/photo/memory_b2.jpg").displayOrder(1).build()
        ));

        when(travelMemoryService.createMemory(anyList(), any(), eq(1L))).thenReturn(res);

        mockMvc.perform(multipart("/api/memories")
                        .file(file1)
                        .file(file2)
                        .param("title", "Bracket Photos Vacation")
                        .with(user(userDetails)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(205))
                .andExpect(jsonPath("$.title").value("Bracket Photos Vacation"))
                .andExpect(jsonPath("$.images.length()").value(2));
    }

    @Test
    @DisplayName("POST /api/memories - Legacy Single-Photo Parameter Compatibility")
    void testCreateMemory_LegacySinglePhoto_Success() throws Exception {
        UserDetailsImpl userDetails = new UserDetailsImpl(1L, "traveler", "traveler@test.com", "pass", Collections.emptyList());
        MockMultipartFile legacyFile = new MockMultipartFile("photo", "single.jpg", "image/jpeg", new byte[]{1, 2});

        TravelMemoryResponse res = new TravelMemoryResponse();
        res.setId(201L);
        res.setTitle("Single Photo Legacy");
        res.setImageUrl("/api/memories/photo/memory_single.jpg");

        when(travelMemoryService.createMemory(anyList(), any(), eq(1L))).thenReturn(res);

        mockMvc.perform(multipart("/api/memories")
                        .file(legacyFile)
                        .param("title", "Single Photo Legacy")
                        .with(user(userDetails)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(201))
                .andExpect(jsonPath("$.title").value("Single Photo Legacy"));
    }

    @Test
    @DisplayName("POST /api/memories - Service Exception Returns 400 Bad Request")
    void testCreateMemory_BoundaryExceeded_Returns400() throws Exception {
        UserDetailsImpl userDetails = new UserDetailsImpl(1L, "traveler", "traveler@test.com", "pass", Collections.emptyList());
        MockMultipartFile file = new MockMultipartFile("photo", "single.jpg", "image/jpeg", new byte[]{1, 2});

        when(travelMemoryService.createMemory(anyList(), any(), eq(1L)))
                .thenThrow(new IllegalArgumentException("Maximum 5 photos allowed per travel memory."));

        mockMvc.perform(multipart("/api/memories")
                        .file(file)
                        .param("title", "Over limit")
                        .with(user(userDetails)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Maximum 5 photos allowed per travel memory."));
    }

    @Test
    @DisplayName("GET /api/memories/public?destinationId=100 - Public access with destination filter")
    void testGetPublicMemories_WithDestinationFilter() throws Exception {
        TravelMemoryResponse res = new TravelMemoryResponse();
        res.setId(102L);
        res.setTitle("Jaipur Experience");
        res.setDestinationId(100L);
        res.setDestinationName("Jaipur");
        res.setVisibility("PUBLIC");

        when(travelMemoryService.getPublicMemoriesByDestination(eq(100L))).thenReturn(List.of(res));

        mockMvc.perform(get("/api/memories/public").param("destinationId", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Jaipur Experience"))
                .andExpect(jsonPath("$[0].destinationName").value("Jaipur"));
    }

    @Test
    @DisplayName("GET /api/destinations/{id}/experiences - Public access without authentication")
    void testGetDestinationExperiences_PermitAll() throws Exception {
        TravelMemoryResponse res = new TravelMemoryResponse();
        res.setId(103L);
        res.setTitle("Hawa Mahal Morning");
        res.setDestinationId(333L);
        res.setVisibility("PUBLIC");

        org.springframework.data.domain.Page<TravelMemoryResponse> page = new org.springframework.data.domain.PageImpl<>(
                List.of(res), org.springframework.data.domain.PageRequest.of(0, 10), 1
        );

        when(travelMemoryService.getPublicMemoriesByDestination(eq(333L), any())).thenReturn(page);

        mockMvc.perform(get("/api/destinations/333/experiences").param("page", "0").param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].title").value("Hawa Mahal Morning"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @DisplayName("DELETE /api/memories/{id} - Unauthorized without token")
    void testDeleteMemory_Unauthorized() throws Exception {
        mockMvc.perform(delete("/api/memories/1"))
                .andExpect(status().isUnauthorized());
    }
}
