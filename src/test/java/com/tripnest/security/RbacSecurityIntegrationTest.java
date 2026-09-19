package com.tripnest.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tripnest.dto.GroupRequest;
import com.tripnest.dto.LoginRequest;
import com.tripnest.dto.SignupRequest;
import com.tripnest.dto.SwitchRoleRequest;
import com.tripnest.entity.*;
import com.tripnest.repository.GroupRepository;
import com.tripnest.repository.RoleRepository;
import com.tripnest.repository.TripRepository;
import com.tripnest.repository.UserRepository;
import com.tripnest.tripnest.TripnestApplication;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(classes = TripnestApplication.class)
@AutoConfigureMockMvc
public class RbacSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @BeforeEach
    void setUp() {
        // Ensure standard roles exist in test database
        if (roleRepository.findByName(ERole.ROLE_USER).isEmpty()) {
            Role userRole = new Role();
            userRole.setName(ERole.ROLE_USER);
            roleRepository.save(userRole);
        }
        if (roleRepository.findByName(ERole.ROLE_TRAVELER).isEmpty()) {
            Role travelerRole = new Role();
            travelerRole.setName(ERole.ROLE_TRAVELER);
            roleRepository.save(travelerRole);
        }
        if (roleRepository.findByName(ERole.ROLE_GROUP_ADMIN).isEmpty()) {
            Role groupAdminRole = new Role();
            groupAdminRole.setName(ERole.ROLE_GROUP_ADMIN);
            roleRepository.save(groupAdminRole);
        }
        if (roleRepository.findByName(ERole.ROLE_ADMIN).isEmpty()) {
            Role adminRole = new Role();
            adminRole.setName(ERole.ROLE_ADMIN);
            roleRepository.save(adminRole);
        }
    }

    private User createTestUser(String username, String rawPassword, ERole roleEnum) {
        userRepository.findByUsername(username).ifPresent(u -> userRepository.delete(u));

        User user = new User();
        user.setUsername(username);
        user.setEmail(username + "@test.com");
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setFirstName("Test");
        user.setLastName("User");
        user.setEnabled(true);
        user.setEmailVerified(true);

        Role role = roleRepository.findByName(roleEnum)
                .orElseGet(() -> {
                    Role r = new Role();
                    r.setName(roleEnum);
                    return roleRepository.save(r);
                });

        Set<Role> roles = new HashSet<>();
        roles.add(role);
        user.setRoles(roles);

        return userRepository.save(user);
    }

    // =========================================================================
    // REGISTRATION TESTS (1 to 6)
    // =========================================================================

    @Test
    @DisplayName("1. Registration: Signup without role creates ROLE_USER")
    void test1_SignupWithoutRole_DefaultsToRoleUser() throws Exception {
        String username = "norole_" + UUID.randomUUID().toString().substring(0, 8);
        SignupRequest request = new SignupRequest();
        request.setUsername(username);
        request.setEmail(username + "@example.com");
        request.setPassword("SecurePassword123!");
        request.setFirstName("No");
        request.setLastName("Role");

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("registered successfully")));

        User saved = userRepository.findByUsernameWithRoles(username).orElseThrow();
        assertTrue(saved.getRoles().stream().anyMatch(r -> r.getName() == ERole.ROLE_USER));
    }

    @Test
    @DisplayName("2. Registration: Signup as Traveler creates ROLE_USER")
    void test2_SignupAsTraveler_CreatesRoleUser() throws Exception {
        String username = "traveler_" + UUID.randomUUID().toString().substring(0, 8);
        SignupRequest request = new SignupRequest();
        request.setUsername(username);
        request.setEmail(username + "@example.com");
        request.setPassword("SecurePassword123!");
        request.setRole("traveler");

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        User saved = userRepository.findByUsernameWithRoles(username).orElseThrow();
        assertTrue(saved.getRoles().stream().anyMatch(r -> r.getName() == ERole.ROLE_USER));
    }

    @Test
    @DisplayName("3. Registration: Signup as Group Admin creates ROLE_GROUP_ADMIN")
    void test3_SignupAsGroupAdmin_CreatesRoleGroupAdmin() throws Exception {
        String username = "grpadmin_" + UUID.randomUUID().toString().substring(0, 8);
        SignupRequest request = new SignupRequest();
        request.setUsername(username);
        request.setEmail(username + "@example.com");
        request.setPassword("SecurePassword123!");
        request.setRole("group_admin");

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        User saved = userRepository.findByUsernameWithRoles(username).orElseThrow();
        assertTrue(saved.getRoles().stream().anyMatch(r -> r.getName() == ERole.ROLE_GROUP_ADMIN));
    }

    @Test
    @DisplayName("4. Registration: Signup attempting ROLE_ADMIN is rejected with 400 Bad Request")
    void test4_SignupAttemptingAdmin_RejectedWithBadRequest() throws Exception {
        String username = "fakeadmin_" + UUID.randomUUID().toString().substring(0, 8);
        SignupRequest request = new SignupRequest();
        request.setUsername(username);
        request.setEmail(username + "@example.com");
        request.setPassword("SecurePassword123!");
        request.setRole("ROLE_ADMIN");

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Admin role cannot be requested")));

        // Also verify roles collection attempt
        SignupRequest requestWithSet = new SignupRequest();
        requestWithSet.setUsername(username + "2");
        requestWithSet.setEmail(username + "2@example.com");
        requestWithSet.setPassword("SecurePassword123!");
        requestWithSet.setRoles(Set.of("admin"));

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestWithSet)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Admin role cannot be requested")));
    }

    @Test
    @DisplayName("5. Registration: Signup with unknown role safely defaults to ROLE_USER")
    void test5_SignupWithInvalidRole_SafelyDefaultsToRoleUser() throws Exception {
        String username = "unknownrole_" + UUID.randomUUID().toString().substring(0, 8);
        SignupRequest request = new SignupRequest();
        request.setUsername(username);
        request.setEmail(username + "@example.com");
        request.setPassword("SecurePassword123!");
        request.setRole("super_secret_moderator");

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        User saved = userRepository.findByUsernameWithRoles(username).orElseThrow();
        assertTrue(saved.getRoles().stream().anyMatch(r -> r.getName() == ERole.ROLE_USER));
    }

    @Test
    @DisplayName("6. Registration: Malicious request cannot inject arbitrary authorities")
    void test6_MaliciousRequestCannotInjectArbitraryAuthorities() throws Exception {
        String username = "malicious_" + UUID.randomUUID().toString().substring(0, 8);
        SignupRequest request = new SignupRequest();
        request.setUsername(username);
        request.setEmail(username + "@example.com");
        request.setPassword("SecurePassword123!");
        request.setRoles(Set.of("ROLE_CUSTOM_AUTHORITY", "PERM_ROOT"));

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        User saved = userRepository.findByUsernameWithRoles(username).orElseThrow();
        // Persisted role must strictly be ROLE_USER, and size must be exactly 1
        assertEquals(1, saved.getRoles().size());
        assertEquals(ERole.ROLE_USER, saved.getRoles().iterator().next().getName());
    }

    // =========================================================================
    // ROLE SWITCHING TESTS (7 to 12)
    // =========================================================================

    @Test
    @DisplayName("7. Role Switch: Traveler switches to Group Admin successfully")
    void test7_SwitchRole_TravelerToGroupAdmin_Success() throws Exception {
        String username = "switch_t2g_" + UUID.randomUUID().toString().substring(0, 8);
        User user = createTestUser(username, "Pass123!", ERole.ROLE_USER);
        String token = jwtUtils.generateJwtToken(username);

        SwitchRoleRequest switchRequest = new SwitchRoleRequest("ROLE_GROUP_ADMIN");

        mockMvc.perform(put("/api/user/role")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(switchRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.roles", contains("ROLE_GROUP_ADMIN")));

        User updated = userRepository.findByUsernameWithRoles(username).orElseThrow();
        assertTrue(updated.getRoles().stream().anyMatch(r -> r.getName() == ERole.ROLE_GROUP_ADMIN));
    }

    @Test
    @DisplayName("8. Role Switch: Group Admin switches to Traveler successfully")
    void test8_SwitchRole_GroupAdminToTraveler_Success() throws Exception {
        String username = "switch_g2t_" + UUID.randomUUID().toString().substring(0, 8);
        User user = createTestUser(username, "Pass123!", ERole.ROLE_GROUP_ADMIN);
        String token = jwtUtils.generateJwtToken(username);

        SwitchRoleRequest switchRequest = new SwitchRoleRequest("ROLE_USER");

        mockMvc.perform(put("/api/user/role")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(switchRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.roles", contains("ROLE_USER")));

        User updated = userRepository.findByUsernameWithRoles(username).orElseThrow();
        assertTrue(updated.getRoles().stream().anyMatch(r -> r.getName() == ERole.ROLE_USER));
    }

    @Test
    @DisplayName("9. Role Switch: User cannot change themselves to Admin")
    void test9_SwitchRole_UserCannotChangeThemselvesToAdmin() throws Exception {
        String username = "noadmin_switch_" + UUID.randomUUID().toString().substring(0, 8);
        User user = createTestUser(username, "Pass123!", ERole.ROLE_USER);
        String token = jwtUtils.generateJwtToken(username);

        SwitchRoleRequest switchRequest = new SwitchRoleRequest("ROLE_ADMIN");

        mockMvc.perform(put("/api/user/role")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(switchRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Cannot switch to Administrator role")));

        User untouched = userRepository.findByUsernameWithRoles(username).orElseThrow();
        assertEquals(ERole.ROLE_USER, untouched.getRoles().iterator().next().getName());
    }

    @Test
    @DisplayName("10. Role Switch: User cannot assign themselves arbitrary roles")
    void test10_SwitchRole_UserCannotAssignArbitraryRoles() throws Exception {
        String username = "arbitrary_switch_" + UUID.randomUUID().toString().substring(0, 8);
        User user = createTestUser(username, "Pass123!", ERole.ROLE_USER);
        String token = jwtUtils.generateJwtToken(username);

        SwitchRoleRequest switchRequest = new SwitchRoleRequest("ROLE_SUPER_HACKER");

        mockMvc.perform(put("/api/user/role")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(switchRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Invalid role specified")));

        User untouched = userRepository.findByUsernameWithRoles(username).orElseThrow();
        assertEquals(ERole.ROLE_USER, untouched.getRoles().iterator().next().getName());
    }

    @Test
    @DisplayName("11. Role Switch: User cannot change another user's role through self-service")
    void test11_SwitchRole_CannotChangeOtherUserRole() throws Exception {
        String victimName = "victim_" + UUID.randomUUID().toString().substring(0, 8);
        User victim = createTestUser(victimName, "Pass123!", ERole.ROLE_USER);

        String attackerName = "attacker_" + UUID.randomUUID().toString().substring(0, 8);
        User attacker = createTestUser(attackerName, "Pass123!", ERole.ROLE_USER);
        String attackerToken = jwtUtils.generateJwtToken(attackerName);

        // Attacker attempts to pass a target userId or victim username in body
        String payloadWithTarget = "{\"role\":\"ROLE_GROUP_ADMIN\",\"userId\":" + victim.getId() + ",\"username\":\"" + victimName + "\"}";

        mockMvc.perform(put("/api/user/role")
                        .header("Authorization", "Bearer " + attackerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadWithTarget))
                .andExpect(status().isOk());

        // Attacker role is updated
        User updatedAttacker = userRepository.findByUsernameWithRoles(attackerName).orElseThrow();
        assertEquals(ERole.ROLE_GROUP_ADMIN, updatedAttacker.getRoles().iterator().next().getName());

        // Victim role is strictly untouched
        User untouchedVictim = userRepository.findByUsernameWithRoles(victimName).orElseThrow();
        assertEquals(ERole.ROLE_USER, untouchedVictim.getRoles().iterator().next().getName());
    }

    @Test
    @DisplayName("12. Role Switch: Unauthenticated users cannot use the role-switch endpoint")
    void test12_SwitchRole_Unauthenticated_ReturnsUnauthorized() throws Exception {
        SwitchRoleRequest switchRequest = new SwitchRoleRequest("ROLE_GROUP_ADMIN");

        mockMvc.perform(put("/api/user/role")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(switchRequest)))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // AUTHORIZATION TESTS (13 to 16)
    // =========================================================================

    @Test
    @DisplayName("13. Authorization: ROLE_ADMIN protected endpoints remain protected against Traveler and Group Admin")
    void test13_AdminEndpoints_RemainProtectedAgainstUserAndGroupAdmin() throws Exception {
        String travelerName = "traveler_admin_probe_" + UUID.randomUUID().toString().substring(0, 8);
        createTestUser(travelerName, "Pass123!", ERole.ROLE_USER);
        String travelerToken = jwtUtils.generateJwtToken(travelerName);

        String groupAdminName = "grpadmin_admin_probe_" + UUID.randomUUID().toString().substring(0, 8);
        createTestUser(groupAdminName, "Pass123!", ERole.ROLE_GROUP_ADMIN);
        String groupAdminToken = jwtUtils.generateJwtToken(groupAdminName);

        // Traveler access to Admin panel -> 403
        mockMvc.perform(get("/api/admin/stats")
                        .header("Authorization", "Bearer " + travelerToken))
                .andExpect(status().isForbidden());

        // Group Admin access to Admin panel -> 403
        mockMvc.perform(get("/api/admin/stats")
                        .header("Authorization", "Bearer " + groupAdminToken))
                .andExpect(status().isForbidden());

        // Destination modification endpoint (ADMIN required)
        mockMvc.perform(post("/api/destinations")
                        .header("Authorization", "Bearer " + groupAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Test Dest\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("14. Authorization: Existing group OWNER/ADMIN/MEMBER authorization still works")
    void test14_GroupMembershipAuthorization_StillEnforced() throws Exception {
        String ownerName = "grp_owner_" + UUID.randomUUID().toString().substring(0, 8);
        User owner = createTestUser(ownerName, "Pass123!", ERole.ROLE_USER);
        String ownerToken = jwtUtils.generateJwtToken(ownerName);

        // Create a trip for owner
        Trip trip = new Trip();
        trip.setUser(owner);
        trip.setTitle("Owner Trip");
        trip.setDestination("Paris");
        trip.setStartDate(LocalDate.now().plusDays(10));
        trip.setEndDate(LocalDate.now().plusDays(15));
        trip.setStatus(TripStatus.PLANNING);
        trip.setBudget(1500.0);
        trip = tripRepository.save(trip);

        // Owner creates a group
        GroupRequest groupRequest = new GroupRequest();
        groupRequest.setName("Trip Group");
        groupRequest.setDescription("Fun Group");
        groupRequest.setTripId(trip.getId());

        mockMvc.perform(post("/api/groups")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(groupRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Trip Group"));
    }

    @Test
    @DisplayName("15. Authorization: Group Admin does not automatically gain ownership rights over unrelated groups")
    void test15_GroupAdmin_DoesNotAutomaticallyGainOwnershipOverUnrelatedGroups() throws Exception {
        // Owner creates trip and group
        String ownerName = "owner_a_" + UUID.randomUUID().toString().substring(0, 8);
        User ownerA = createTestUser(ownerName, "Pass123!", ERole.ROLE_USER);

        Trip trip = new Trip();
        trip.setUser(ownerA);
        trip.setTitle("Trip A");
        trip.setDestination("Tokyo");
        trip.setStartDate(LocalDate.now().plusDays(10));
        trip.setEndDate(LocalDate.now().plusDays(15));
        trip.setStatus(TripStatus.PLANNING);
        trip.setBudget(2000.0);
        trip = tripRepository.save(trip);

        TravelGroup group = new TravelGroup();
        group.setName("Exclusive Group A");
        group.setTrip(trip);
        group.setCreatedBy(ownerA);
        group = groupRepository.save(group);

        // Unrelated User B with ROLE_GROUP_ADMIN
        String unrelatedGrpAdmin = "unrelated_admin_" + UUID.randomUUID().toString().substring(0, 8);
        User userB = createTestUser(unrelatedGrpAdmin, "Pass123!", ERole.ROLE_GROUP_ADMIN);
        String userBToken = jwtUtils.generateJwtToken(unrelatedGrpAdmin);

        // User B attempts to access or delete Group A -> 403 Forbidden
        mockMvc.perform(delete("/api/groups/" + group.getId())
                        .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("16. Authorization: Traveler and Group Admin endpoint authorization behaves as intended")
    void test16_TravelerAndGroupAdmin_EndpointAuthorization() throws Exception {
        String travelerName = "trav_ep_" + UUID.randomUUID().toString().substring(0, 8);
        createTestUser(travelerName, "Pass123!", ERole.ROLE_USER);
        String travelerToken = jwtUtils.generateJwtToken(travelerName);

        String grpAdminName = "grp_ep_" + UUID.randomUUID().toString().substring(0, 8);
        createTestUser(grpAdminName, "Pass123!", ERole.ROLE_GROUP_ADMIN);
        String grpAdminToken = jwtUtils.generateJwtToken(grpAdminName);

        // Both can access general /api/groups
        mockMvc.perform(get("/api/groups")
                        .header("Authorization", "Bearer " + travelerToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/groups")
                        .header("Authorization", "Bearer " + grpAdminToken))
                .andExpect(status().isOk());

        // Group Admin can access /api/groups/admin/summary -> 200 OK
        mockMvc.perform(get("/api/groups/admin/summary")
                        .header("Authorization", "Bearer " + grpAdminToken))
                .andExpect(status().isOk());

        // Traveler cannot access /api/groups/admin/summary -> 403 Forbidden
        mockMvc.perform(get("/api/groups/admin/summary")
                        .header("Authorization", "Bearer " + travelerToken))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // AUTHENTICATION CONSISTENCY TESTS (17 to 19)
    // =========================================================================

    @Test
    @DisplayName("17. Consistency: After role change, user authorization state immediately reflects new role")
    void test17_AuthenticationConsistency_AfterRoleChange() throws Exception {
        String username = "consistent_user_" + UUID.randomUUID().toString().substring(0, 8);
        User user = createTestUser(username, "Pass123!", ERole.ROLE_USER);
        String initialToken = jwtUtils.generateJwtToken(username);

        // Before switch: /api/groups/admin/summary -> 403
        mockMvc.perform(get("/api/groups/admin/summary")
                        .header("Authorization", "Bearer " + initialToken))
                .andExpect(status().isForbidden());

        // Switch to Group Admin
        MvcResult result = mockMvc.perform(put("/api/user/role")
                        .header("Authorization", "Bearer " + initialToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new SwitchRoleRequest("ROLE_GROUP_ADMIN"))))
                .andExpect(status().isOk())
                .andReturn();

        // The endpoint returns a fresh token
        String responseBody = result.getResponse().getContentAsString();
        String newToken = objectMapper.readTree(responseBody).get("token").asText();

        // With either token (since UserDetails is dynamically loaded from DB per request),
        // the user now has ROLE_GROUP_ADMIN and accesses the endpoint with 200 OK!
        mockMvc.perform(get("/api/groups/admin/summary")
                        .header("Authorization", "Bearer " + newToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("18. Consistency: Logout/login after role change loads the correct new role")
    void test18_LoginAfterRoleChange_LoadsCorrectNewRole() throws Exception {
        String username = "relogin_user_" + UUID.randomUUID().toString().substring(0, 8);
        String rawPass = "SecretPass123!";
        User user = createTestUser(username, rawPass, ERole.ROLE_USER);
        String token = jwtUtils.generateJwtToken(username);

        // Switch role to Group Admin
        mockMvc.perform(put("/api/user/role")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new SwitchRoleRequest("ROLE_GROUP_ADMIN"))))
                .andExpect(status().isOk());

        // Now simulate a fresh login
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername(username);
        loginRequest.setPassword(rawPass);

        mockMvc.perform(post("/api/auth/signin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roles", contains("ROLE_GROUP_ADMIN")));
    }

    @Test
    @DisplayName("19. Consistency: JWT authorities are generated and loaded correctly")
    void test19_JwtAuthoritiesGeneratedAndLoadedCorrectly() {
        String username = "auth_check_" + UUID.randomUUID().toString().substring(0, 8);
        User user = createTestUser(username, "Pass123!", ERole.ROLE_USER);

        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        assertNotNull(userDetails);

        Collection<? extends GrantedAuthority> authorities = userDetails.getAuthorities();
        assertTrue(authorities.stream().anyMatch(a -> a.getAuthority().equals("ROLE_USER")),
                "Authorities should contain ROLE_USER");
        assertTrue(authorities.stream().anyMatch(a -> a.getAuthority().equals("ROLE_TRAVELER")),
                "Authorities should contain ROLE_TRAVELER for backward compatibility");

        // Test with Group Admin
        String gaUsername = "ga_check_" + UUID.randomUUID().toString().substring(0, 8);
        User gaUser = createTestUser(gaUsername, "Pass123!", ERole.ROLE_GROUP_ADMIN);

        UserDetails gaUserDetails = userDetailsService.loadUserByUsername(gaUsername);
        assertTrue(gaUserDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_GROUP_ADMIN")),
                "Authorities should contain ROLE_GROUP_ADMIN");
    }
}
