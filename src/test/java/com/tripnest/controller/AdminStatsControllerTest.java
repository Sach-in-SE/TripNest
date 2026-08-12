package com.tripnest.controller;

import com.tripnest.dto.AdminStatsResponse;
import com.tripnest.service.AdminStatsService;
import com.tripnest.tripnest.TripnestApplication;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = TripnestApplication.class)
@AutoConfigureMockMvc
class AdminStatsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AdminStatsService adminStatsService;

    private AdminStatsResponse sampleStats;

    @BeforeEach
    void setUp() {
        sampleStats = new AdminStatsResponse();
        sampleStats.setTotalUsers(25);
        sampleStats.setActiveUsers(24);
        sampleStats.setDisabledUsers(1);

        sampleStats.setTotalTrips(15);
        sampleStats.setActiveTrips(10);
        sampleStats.setPlanningTrips(4);
        sampleStats.setUpcomingTrips(3);
        sampleStats.setOngoingTrips(3);
        sampleStats.setCompletedTrips(4);
        sampleStats.setCancelledTrips(1);

        sampleStats.setTotalDestinations(50);

        sampleStats.setTotalBudgetedAmount(12500.50);
        sampleStats.setTotalExpensesAmount(8400.25);
        sampleStats.setTotalExpensesCount(42);
    }

    @Test
    void unauthenticatedGetStatsShouldBeUnauthorized() throws Exception {
        mockMvc.perform(get("/api/admin/stats"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "TRAVELER")
    void travelerGetStatsShouldBeForbidden() throws Exception {
        mockMvc.perform(get("/api/admin/stats"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminGetStatsShouldReturnSystemMetrics() throws Exception {
        when(adminStatsService.getAdminStats()).thenReturn(sampleStats);

        mockMvc.perform(get("/api/admin/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsers").value(25))
                .andExpect(jsonPath("$.activeUsers").value(24))
                .andExpect(jsonPath("$.disabledUsers").value(1))
                .andExpect(jsonPath("$.totalTrips").value(15))
                .andExpect(jsonPath("$.activeTrips").value(10))
                .andExpect(jsonPath("$.totalDestinations").value(50))
                .andExpect(jsonPath("$.totalBudgetedAmount").value(12500.50))
                .andExpect(jsonPath("$.totalExpensesAmount").value(8400.25))
                .andExpect(jsonPath("$.totalExpensesCount").value(42));
    }
}
