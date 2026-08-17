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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

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
    @DisplayName("GET /api/memories/photo/{fileName} - Public photo serving")
    void testGetPhoto_PermitAll() throws Exception {
        ByteArrayResource imageResource = new ByteArrayResource(new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x00});
        when(travelMemoryService.getMemoryPhotoResource(eq("public_photo.jpg"), any())).thenReturn(imageResource);

        mockMvc.perform(get("/api/memories/photo/public_photo.jpg"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", MediaType.IMAGE_JPEG_VALUE));
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
    @DisplayName("DELETE /api/memories/{id} - Unauthorized without token")
    void testDeleteMemory_Unauthorized() throws Exception {
        mockMvc.perform(delete("/api/memories/1"))
                .andExpect(status().isUnauthorized());
    }
}
