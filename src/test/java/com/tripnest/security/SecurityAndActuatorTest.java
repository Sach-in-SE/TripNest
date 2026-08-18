package com.tripnest.security;

import com.tripnest.tripnest.TripnestApplication;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(classes = TripnestApplication.class)
@AutoConfigureMockMvc
public class SecurityAndActuatorTest {

    @Autowired
    private MockMvc mockMvc;

    // =========================================================================
    // A. Actuator Health & Info Endpoint Tests
    // =========================================================================

    @Test
    @DisplayName("GET /actuator/health without JWT returns 200 OK and status UP")
    void testActuatorHealth_PublicAccess() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("UP")))
                .andExpect(jsonPath("$.details").doesNotExist()) // details must NOT be leaked
                .andExpect(jsonPath("$.components").doesNotExist());
    }

    @Test
    @DisplayName("GET /actuator/health/liveness without JWT returns 200 OK and status UP")
    void testActuatorLivenessProbe() throws Exception {
        mockMvc.perform(get("/actuator/health/liveness"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("UP")));
    }

    @Test
    @DisplayName("GET /actuator/health/readiness without JWT returns 200 OK and status UP")
    void testActuatorReadinessProbe() throws Exception {
        mockMvc.perform(get("/actuator/health/readiness"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("UP")));
    }

    @Test
    @DisplayName("GET /actuator/info without JWT returns 200 OK")
    void testActuatorInfo_PublicAccess() throws Exception {
        mockMvc.perform(get("/actuator/info"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Sensitive actuator endpoints like /actuator/env are NOT publicly exposed")
    void testSensitiveActuatorEndpoints_NotExposed() throws Exception {
        mockMvc.perform(get("/actuator/env"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/actuator/beans"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/actuator/configprops"))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // B. Security Headers Tests
    // =========================================================================

    @Test
    @DisplayName("Responses include standard production security headers")
    void testSecurityHeaders() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("X-Frame-Options", "DENY"))
                .andExpect(header().string("Referrer-Policy", "strict-origin-when-cross-origin"));
    }

    // =========================================================================
    // C. Authorization Regressions
    // =========================================================================

    @Test
    @DisplayName("Protected API endpoints like /api/trips return 401 Unauthorized without JWT")
    void testProtectedApi_RequiresAuth() throws Exception {
        mockMvc.perform(get("/api/trips"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Admin API endpoints like /api/admin/users return 401 Unauthorized without JWT")
    void testAdminApi_RequiresAuth() throws Exception {
        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Public destinations endpoint remains publicly accessible")
    void testPublicDestinations_RemainsPublic() throws Exception {
        mockMvc.perform(get("/api/destinations"))
                .andExpect(status().isOk());
    }

    // =========================================================================
    // D. Global Exception Handler Validation & Format
    // =========================================================================

    @Test
    @DisplayName("Invalid payload to signup endpoint returns 400 Bad Request with standardized error structure")
    void testValidationErrorResponseFormat() throws Exception {
        // Send empty payload to signup endpoint
        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", notNullValue()))
                .andExpect(jsonPath("$.stackTrace").doesNotExist());
    }
}
