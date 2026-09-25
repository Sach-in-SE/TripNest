package com.tripnest.controller;

import com.tripnest.dto.DestinationResponse;
import com.tripnest.dto.ForgotPasswordRequest;
import com.tripnest.service.DestinationService;
import com.tripnest.service.PasswordResetService;
import com.tripnest.tripnest.TripnestApplication;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(classes = TripnestApplication.class)
@AutoConfigureMockMvc
public class DestinationPaginationAndAuthTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private DestinationService destinationService;

    @MockitoBean
    private PasswordResetService passwordResetService;

    @Test
    @DisplayName("GET /api/destinations supports pagination with Pageable")
    void testGetDestinations_ReturnsPageObject() throws Exception {
        DestinationResponse dest1 = new DestinationResponse();
        dest1.setId(1L);
        dest1.setName("Goa");

        DestinationResponse dest2 = new DestinationResponse();
        dest2.setId(2L);
        dest2.setName("Manali");

        Page<DestinationResponse> page = new PageImpl<>(List.of(dest1, dest2));
        when(destinationService.getAllDestinations(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/destinations")
                        .param("page", "0")
                        .param("size", "20")
                        .param("sort", "name,asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content[0].name").value("Goa"))
                .andExpect(jsonPath("$.content[1].name").value("Manali"))
                .andExpect(jsonPath("$.totalElements").value(2));

        verify(destinationService).getAllDestinations(any(Pageable.class));
    }

    @Test
    @DisplayName("POST /api/auth/forgot-password returns clean production message")
    void testForgotPassword_ReturnsCleanProductionMessage() throws Exception {
        doNothing().when(passwordResetService).createResetToken("user@example.com");

        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("user@example.com");

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("If this email is registered, a password reset link has been sent to your email address."));
    }

    @Test
    @DisplayName("POST /api/auth/forgot-password with unregistered email returns same generic message")
    void testForgotPassword_UnregisteredEmail_ReturnsGenericMessage() throws Exception {
        doThrow(new RuntimeException("No account found")).when(passwordResetService).createResetToken("unknown@example.com");

        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("unknown@example.com");

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("If this email is registered, a password reset link has been sent to your email address."));
    }
}
