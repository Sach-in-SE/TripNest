package com.tripnest.controller;

import com.tripnest.dto.AdminUserResponse;
import com.tripnest.service.AdminUserService;
import com.tripnest.tripnest.TripnestApplication;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Set;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = TripnestApplication.class)
@AutoConfigureMockMvc
class AdminUserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AdminUserService adminUserService;

    private AdminUserResponse sampleUserResponse;

    @BeforeEach
    void setUp() {
        sampleUserResponse = new AdminUserResponse();
        sampleUserResponse.setId(10L);
        sampleUserResponse.setUsername("john_traveler");
        sampleUserResponse.setEmail("john@example.com");
        sampleUserResponse.setFirstName("John");
        sampleUserResponse.setLastName("Doe");
        sampleUserResponse.setEnabled(true);
        sampleUserResponse.setEmailVerified(true);
        sampleUserResponse.setProvider("LOCAL");
        sampleUserResponse.setRoles(List.of("ROLE_TRAVELER"));
    }

    @Test
    void unauthenticatedGetUsersShouldBeUnauthorized() throws Exception {
        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "TRAVELER")
    void travelerGetUsersShouldBeForbidden() throws Exception {
        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminGetUsersShouldReturnUserList() throws Exception {
        when(adminUserService.getUsers(null, null, null))
                .thenReturn(List.of(sampleUserResponse));

        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].username").value("john_traveler"))
                .andExpect(jsonPath("$[0].email").value("john@example.com"))
                .andExpect(jsonPath("$[0].password").doesNotExist());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminSearchUsersShouldFilterResults() throws Exception {
        when(adminUserService.getUsers("john", true, "ROLE_TRAVELER"))
                .thenReturn(List.of(sampleUserResponse));

        mockMvc.perform(get("/api/admin/users")
                        .param("search", "john")
                        .param("enabled", "true")
                        .param("role", "ROLE_TRAVELER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].username").value("john_traveler"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminGetUserByIdShouldReturnDetails() throws Exception {
        when(adminUserService.getUserById(10L))
                .thenReturn(sampleUserResponse);

        mockMvc.perform(get("/api/admin/users/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.username").value("john_traveler"))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminUpdateUserStatusShouldModifyAccountState() throws Exception {
        sampleUserResponse.setEnabled(false);
        when(adminUserService.updateUserStatus(eq(10L), eq(false), any()))
                .thenReturn(sampleUserResponse);

        mockMvc.perform(put("/api/admin/users/10/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"enabled\": false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.enabled").value(false));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminUpdateUserRolesShouldModifyRoleAssignment() throws Exception {
        sampleUserResponse.setRoles(List.of("ROLE_TRAVELER", "ROLE_GROUP_ADMIN"));
        when(adminUserService.updateUserRoles(eq(10L), eq(Set.of("ROLE_TRAVELER", "ROLE_GROUP_ADMIN")), any()))
                .thenReturn(sampleUserResponse);

        mockMvc.perform(put("/api/admin/users/10/roles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"roles\": [\"ROLE_TRAVELER\", \"ROLE_GROUP_ADMIN\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roles", containsInAnyOrder("ROLE_TRAVELER", "ROLE_GROUP_ADMIN")));
    }

    @Test
    void unauthenticatedResetPasswordShouldBeUnauthorized() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/admin/users/10/reset-password"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "TRAVELER")
    void travelerResetPasswordShouldBeForbidden() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/admin/users/10/reset-password"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminResetPasswordShouldGenerateTemporaryPassword() throws Exception {
        com.tripnest.dto.AdminResetPasswordResponse response = new com.tripnest.dto.AdminResetPasswordResponse(
                10L,
                "john_traveler",
                "Tmp-xK9#mQ2$",
                java.time.LocalDateTime.now().plusHours(24),
                "Temporary password generated successfully."
        );
        when(adminUserService.generateTemporaryPassword(10L)).thenReturn(response);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/admin/users/10/reset-password"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(10))
                .andExpect(jsonPath("$.username").value("john_traveler"))
                .andExpect(jsonPath("$.temporaryPassword").value("Tmp-xK9#mQ2$"));
    }
}
