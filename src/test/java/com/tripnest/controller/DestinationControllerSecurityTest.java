package com.tripnest.controller;

import com.tripnest.service.DestinationService;
import com.tripnest.tripnest.TripnestApplication;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = TripnestApplication.class)
@AutoConfigureMockMvc
class DestinationControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DestinationService destinationService;

    @Test
    void publicGetDestinationsShouldBeAllowed() throws Exception {
        mockMvc.perform(get("/api/destinations"))
                .andExpect(status().isOk());
    }

    @Test
    void unauthenticatedPostDestinationShouldBeUnauthorized() throws Exception {
        mockMvc.perform(post("/api/destinations")
                        .contentType("application/json")
                        .content("{\"name\":\"Test\",\"country\":\"Test\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "TRAVELER")
    void travelerPostDestinationShouldBeForbidden() throws Exception {
        mockMvc.perform(post("/api/destinations")
                        .contentType("application/json")
                        .content("{\"name\":\"Test\",\"country\":\"Test\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminPostDestinationShouldBeAllowed() throws Exception {
        mockMvc.perform(post("/api/destinations")
                        .contentType("application/json")
                        .content("{\"name\":\"Test\",\"country\":\"Test\"}"))
                .andExpect(status().isOk());
    }
}
