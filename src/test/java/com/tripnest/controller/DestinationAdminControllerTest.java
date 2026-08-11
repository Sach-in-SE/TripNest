package com.tripnest.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tripnest.dto.DestinationRequest;
import com.tripnest.dto.DestinationResponse;
import com.tripnest.exception.ResourceNotFoundException;
import com.tripnest.service.DestinationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = com.tripnest.tripnest.TripnestApplication.class)
@AutoConfigureMockMvc
class DestinationAdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private DestinationService destinationService;

    private DestinationRequest validRequest;
    private DestinationResponse sampleResponse;

    @BeforeEach
    void setUp() {
        validRequest = new DestinationRequest();
        validRequest.setName("Goa");
        validRequest.setState("Goa");
        validRequest.setCountry("India");
        validRequest.setCategory("Beach");
        validRequest.setImageUrl("https://images.unsplash.com/photo-1512343879190");
        validRequest.setLatitude(15.2993);
        validRequest.setLongitude(74.1240);
        validRequest.setEstimatedBudget(30000.0);
        validRequest.setRecommendedDays(5);
        validRequest.setBestSeason("November to February");
        validRequest.setRating(4.7);
        validRequest.setDescription("Beach paradise");

        sampleResponse = new DestinationResponse();
        sampleResponse.setId(1L);
        sampleResponse.setName("Goa");
        sampleResponse.setImageUrl("https://images.unsplash.com/photo-1512343879190");
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createDestination_AdminSuccess() throws Exception {
        when(destinationService.createDestination(any(DestinationRequest.class))).thenReturn(sampleResponse);

        mockMvc.perform(post("/api/destinations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "TRAVELER")
    void createDestination_NonAdminForbidden() throws Exception {
        mockMvc.perform(post("/api/destinations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateDestination_AdminSuccess() throws Exception {
        when(destinationService.updateDestination(eq(1L), any(DestinationRequest.class))).thenReturn(sampleResponse);

        mockMvc.perform(put("/api/destinations/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "TRAVELER")
    void updateDestination_NonAdminForbidden() throws Exception {
        mockMvc.perform(put("/api/destinations/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteDestination_AdminSuccess() throws Exception {
        doNothing().when(destinationService).deleteDestination(1L);

        mockMvc.perform(delete("/api/destinations/1"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "TRAVELER")
    void deleteDestination_NonAdminForbidden() throws Exception {
        mockMvc.perform(delete("/api/destinations/1"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createDestination_InvalidCoordinates_ReturnsBadRequest() throws Exception {
        validRequest.setLatitude(150.0); // Invalid latitude > 90

        mockMvc.perform(post("/api/destinations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getDestinationById_NotFound_Returns404() throws Exception {
        when(destinationService.getDestinationDetails(999L))
                .thenThrow(new ResourceNotFoundException("Destination not found with id: 999"));

        mockMvc.perform(get("/api/destinations/999"))
                .andExpect(status().isNotFound());
    }
}
