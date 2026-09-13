package com.tripnest.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tripnest.dto.FavoriteDestinationRequest;
import com.tripnest.dto.FavoriteDestinationResponse;
import com.tripnest.security.UserDetailsImpl;
import com.tripnest.service.FavoriteDestinationService;
import com.tripnest.tripnest.TripnestApplication;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = TripnestApplication.class)
@AutoConfigureMockMvc
public class FavoriteDestinationControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private FavoriteDestinationService favoriteDestinationService;

    @Test
    @DisplayName("GET /api/favorites - Unauthenticated request returns 401 Unauthorized")
    void testGetFavorites_Unauthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/favorites"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/favorites - Unauthenticated request returns 401 Unauthorized")
    void testPostFavorite_Unauthenticated_Returns401() throws Exception {
        FavoriteDestinationRequest request = new FavoriteDestinationRequest();
        request.setDestinationId(100L);

        mockMvc.perform(post("/api/favorites")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("DELETE /api/favorites/{destinationId} - Unauthenticated request returns 401 Unauthorized")
    void testDeleteFavorite_Unauthenticated_Returns401() throws Exception {
        mockMvc.perform(delete("/api/favorites/100"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/favorites - Authenticated user returns 200 OK with favorites list")
    void testGetFavorites_Authenticated_Returns200() throws Exception {
        UserDetailsImpl authUser = new UserDetailsImpl(5L, "lucky", "lucky@test.com", "pass", Collections.emptyList());

        FavoriteDestinationResponse resp = new FavoriteDestinationResponse();
        resp.setId(1L);
        resp.setDestinationId(100L);
        resp.setDestinationName("Goa");
        resp.setCountry("India");
        resp.setCreatedAt(LocalDateTime.now());

        when(favoriteDestinationService.getUserFavorites(5L)).thenReturn(List.of(resp));

        mockMvc.perform(get("/api/favorites").with(user(authUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].destinationId").value(100))
                .andExpect(jsonPath("$[0].destinationName").value("Goa"));

        verify(favoriteDestinationService).getUserFavorites(5L);
    }

    @Test
    @DisplayName("POST /api/favorites - Authenticated user adds favorite returns 200 OK")
    void testPostFavorite_Authenticated_Returns200() throws Exception {
        UserDetailsImpl authUser = new UserDetailsImpl(5L, "lucky", "lucky@test.com", "pass", Collections.emptyList());

        FavoriteDestinationRequest request = new FavoriteDestinationRequest();
        request.setDestinationId(100L);

        FavoriteDestinationResponse resp = new FavoriteDestinationResponse();
        resp.setId(1L);
        resp.setDestinationId(100L);
        resp.setDestinationName("Goa");

        when(favoriteDestinationService.addFavorite(any(FavoriteDestinationRequest.class), eq(5L)))
                .thenReturn(resp);

        mockMvc.perform(post("/api/favorites")
                        .with(user(authUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.destinationId").value(100))
                .andExpect(jsonPath("$.destinationName").value("Goa"));

        verify(favoriteDestinationService).addFavorite(any(FavoriteDestinationRequest.class), eq(5L));
    }

    @Test
    @DisplayName("DELETE /api/favorites/{destinationId} - Authenticated user removes favorite returns 200 OK")
    void testDeleteFavorite_Authenticated_Returns200() throws Exception {
        UserDetailsImpl authUser = new UserDetailsImpl(5L, "lucky", "lucky@test.com", "pass", Collections.emptyList());

        mockMvc.perform(delete("/api/favorites/100").with(user(authUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Destination removed from favorites"));

        verify(favoriteDestinationService).removeFavorite(100L, 5L);
    }
}
