package com.tripnest.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tripnest.dto.*;
import com.tripnest.entity.*;
import com.tripnest.model.ExpenseSplit;
import com.tripnest.repository.*;
import com.tripnest.service.*;
import com.tripnest.tripnest.TripnestApplication;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(classes = TripnestApplication.class)
@AutoConfigureMockMvc
public class SecurityRegressionHardeningTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private RateLimitingFilter rateLimitingFilter;

    @MockitoBean
    private TripRepository tripRepository;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private TripShareService tripShareService;

    @MockitoBean
    private GroupRepository groupRepository;

    @MockitoBean
    private GroupMemberRepository groupMemberRepository;

    @MockitoBean
    private ItineraryRepository itineraryRepository;

    @MockitoBean
    private ActivityRepository activityRepository;

    @MockitoBean
    private ExpenseRepository expenseRepository;

    @MockitoBean
    private ExpenseSplitRepository expenseSplitRepository;

    @MockitoBean
    private NotificationRepository notificationRepository;

    @MockitoBean
    private DisposableEmailService disposableEmailService;

    @Autowired
    private GroupService groupService;

    @Autowired
    private ExpenseService expenseService;

    @Autowired
    private ItineraryService itineraryService;

    private User victimUser;
    private User attackerUser;
    private User adminUser;
    private Trip victimTrip;
    private Expense victimExpense;

    private UserDetailsImpl victimPrincipal;
    private UserDetailsImpl attackerPrincipal;
    private UserDetailsImpl adminPrincipal;

    @BeforeEach
    void setUp() {
        rateLimitingFilter.resetCounts();

        victimUser = new User();
        victimUser.setId(10L);
        victimUser.setUsername("victim");
        victimUser.setEmail("victim@example.com");

        attackerUser = new User();
        attackerUser.setId(99L);
        attackerUser.setUsername("attacker");
        attackerUser.setEmail("attacker@example.com");

        adminUser = new User();
        adminUser.setId(1L);
        adminUser.setUsername("admin");
        adminUser.setEmail("admin@tripnest.com");

        victimTrip = new Trip();
        victimTrip.setId(100L);
        victimTrip.setTitle("Victim's Private Trip");
        victimTrip.setUser(victimUser);
        victimTrip.setStartDate(LocalDate.now());
        victimTrip.setEndDate(LocalDate.now().plusDays(5));

        victimExpense = new Expense();
        victimExpense.setId(200L);
        victimExpense.setTitle("Museum Tickets");
        victimExpense.setAmount(100.0);
        victimExpense.setTrip(victimTrip);
        victimExpense.setUser(victimUser);

        victimPrincipal = new UserDetailsImpl(
                victimUser.getId(),
                victimUser.getUsername(),
                victimUser.getEmail(),
                "password",
                List.of(new SimpleGrantedAuthority("ROLE_TRAVELER"))
        );

        attackerPrincipal = new UserDetailsImpl(
                attackerUser.getId(),
                attackerUser.getUsername(),
                attackerUser.getEmail(),
                "password",
                List.of(new SimpleGrantedAuthority("ROLE_TRAVELER"))
        );

        adminPrincipal = new UserDetailsImpl(
                adminUser.getId(),
                adminUser.getUsername(),
                adminUser.getEmail(),
                "password",
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
    }

    // ---------------------------------------------------------------------------------------------
    // 1. BOLA Hardening: Group creation on another user's trip
    // ---------------------------------------------------------------------------------------------
    @Test
    @DisplayName("BOLA: Attacker cannot create a group attached to victim's trip")
    void testCreateGroup_UnauthorizedTrip_ThrowsAccessDenied() {
        when(tripRepository.findById(100L)).thenReturn(Optional.of(victimTrip));
        when(userRepository.findById(99L)).thenReturn(Optional.of(attackerUser));
        when(tripShareService.hasEditAccess(100L, 99L)).thenReturn(false);

        GroupRequest request = new GroupRequest();
        request.setName("Attacker Group");
        request.setTripId(100L);

        assertThrows(AccessDeniedException.class, () -> {
            groupService.createGroup(request, 99L);
        });
    }

    @Test
    @DisplayName("BOLA HTTP: Attacker cannot create a group on victim's trip via REST API (returns 403)")
    void testCreateGroup_UnauthorizedTrip_Returns403() throws Exception {
        when(tripRepository.findById(100L)).thenReturn(Optional.of(victimTrip));
        when(userRepository.findById(99L)).thenReturn(Optional.of(attackerUser));
        when(tripShareService.hasEditAccess(100L, 99L)).thenReturn(false);

        GroupRequest request = new GroupRequest();
        request.setName("Malicious Group Takeover");
        request.setTripId(100L);

        mockMvc.perform(post("/api/groups")
                        .with(user(attackerPrincipal))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    // ---------------------------------------------------------------------------------------------
    // 2. BOLA Hardening: Viewing groups for another user's trip
    // ---------------------------------------------------------------------------------------------
    @Test
    @DisplayName("BOLA: Attacker cannot view groups for victim's trip")
    void testGetTripGroups_UnauthorizedUser_ThrowsAccessDenied() {
        when(tripRepository.findById(100L)).thenReturn(Optional.of(victimTrip));
        when(tripShareService.hasAccess(100L, 99L)).thenReturn(false);
        when(groupRepository.existsByTripIdAndMembersId(100L, 99L)).thenReturn(false);

        assertThrows(AccessDeniedException.class, () -> {
            groupService.getTripGroups(100L, 99L);
        });
    }

    @Test
    @DisplayName("BOLA HTTP: Attacker cannot view groups of victim's trip via REST API (returns 403)")
    void testGetTripGroups_UnauthorizedUser_Returns403() throws Exception {
        when(tripRepository.findById(100L)).thenReturn(Optional.of(victimTrip));
        when(tripShareService.hasAccess(100L, 99L)).thenReturn(false);
        when(groupRepository.existsByTripIdAndMembersId(100L, 99L)).thenReturn(false);

        mockMvc.perform(get("/api/groups/trip/100")
                        .with(user(attackerPrincipal)))
                .andExpect(status().isForbidden());
    }

    // ---------------------------------------------------------------------------------------------
    // 3. BOLA Hardening: Viewing total expenses for another user's trip
    // ---------------------------------------------------------------------------------------------
    @Test
    @DisplayName("BOLA: Attacker cannot view total expenses of victim's trip")
    void testGetTotalExpenses_UnauthorizedUser_ThrowsAccessDenied() {
        when(tripRepository.findById(100L)).thenReturn(Optional.of(victimTrip));
        when(tripShareService.hasAccess(100L, 99L)).thenReturn(false);
        when(groupRepository.existsByTripIdAndMembersId(100L, 99L)).thenReturn(false);

        assertThrows(AccessDeniedException.class, () -> {
            expenseService.getTotalExpenses(100L, 99L);
        });
    }

    @Test
    @DisplayName("BOLA HTTP: Attacker querying /api/expenses/trip/100/total returns 403 Forbidden")
    void testGetTotalExpenses_UnauthorizedUser_Returns403() throws Exception {
        when(tripRepository.findById(100L)).thenReturn(Optional.of(victimTrip));
        when(tripShareService.hasAccess(100L, 99L)).thenReturn(false);
        when(groupRepository.existsByTripIdAndMembersId(100L, 99L)).thenReturn(false);

        mockMvc.perform(get("/api/expenses/trip/100/total")
                        .with(user(attackerPrincipal)))
                .andExpect(status().isForbidden());
    }

    // ---------------------------------------------------------------------------------------------
    // 4. Function Authorization / Privilege Escalation: Read-Only collaborator cannot edit itinerary
    // ---------------------------------------------------------------------------------------------
    @Test
    @DisplayName("Privilege Escalation: Read-only (VIEW) collaborator cannot create an itinerary")
    void testCreateItinerary_ReadOnlyCollaborator_ThrowsAccessDenied() {
        when(tripRepository.findById(100L)).thenReturn(Optional.of(victimTrip));
        when(userRepository.findById(99L)).thenReturn(Optional.of(attackerUser));
        // User has VIEW access (hasAccess=true) but NOT EDIT access (hasEditAccess=false)
        when(tripShareService.hasAccess(100L, 99L)).thenReturn(true);
        when(tripShareService.hasEditAccess(100L, 99L)).thenReturn(false);

        ItineraryRequest request = new ItineraryRequest();
        request.setTripId(100L);
        request.setDate(LocalDate.now());
        request.setNotes("Unauthorized itinerary");

        assertThrows(AccessDeniedException.class, () -> {
            itineraryService.createItinerary(request, 99L);
        });
    }

    @Test
    @DisplayName("Privilege Escalation: Read-only (VIEW) collaborator cannot update an itinerary")
    void testUpdateItinerary_ReadOnlyCollaborator_ThrowsAccessDenied() {
        Itinerary itinerary = new Itinerary();
        itinerary.setId(500L);
        itinerary.setTrip(victimTrip);
        itinerary.setDate(LocalDate.now());

        when(itineraryRepository.findById(500L)).thenReturn(Optional.of(itinerary));
        when(tripShareService.hasAccess(100L, 99L)).thenReturn(true);
        when(tripShareService.hasEditAccess(100L, 99L)).thenReturn(false);

        ItineraryRequest request = new ItineraryRequest();
        request.setTripId(100L);
        request.setDate(LocalDate.now());
        request.setNotes("Modified notes");

        assertThrows(AccessDeniedException.class, () -> {
            itineraryService.updateItinerary(500L, request, 99L);
        });
    }

    // ---------------------------------------------------------------------------------------------
    // 5. Notification Security: Spoofing Prevention
    // ---------------------------------------------------------------------------------------------
    @Test
    @DisplayName("Notification Security: Attacker cannot forge notification addressed to another user (returns 403)")
    void testCreateNotification_SpoofedRecipient_Returns403() throws Exception {
        NotificationRequest request = new NotificationRequest();
        request.setUserId(10L); // Victim's ID
        request.setTitle("Phishing Alert");
        request.setMessage("Please reset your password here: http://evil.com");

        mockMvc.perform(post("/api/notifications")
                        .with(user(attackerPrincipal))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Notification Security: Admin CAN create notification addressed to any user")
    void testCreateNotification_AdminRecipient_Returns200() throws Exception {
        when(userRepository.findById(10L)).thenReturn(Optional.of(victimUser));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(i -> i.getArgument(0));

        NotificationRequest request = new NotificationRequest();
        request.setUserId(10L);
        request.setTitle("System Announcement");
        request.setMessage("Maintenance scheduled at midnight.");

        mockMvc.perform(post("/api/notifications")
                        .with(user(adminPrincipal))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    // ---------------------------------------------------------------------------------------------
    // 6. JWT Token Validation: Tampering and Signature Verification
    // ---------------------------------------------------------------------------------------------
    @Test
    @DisplayName("JWT Security: Tampered or invalid signature token is rejected")
    void testValidateJwtToken_TamperedSignature_ReturnsFalse() {
        String validToken = jwtUtils.generateJwtToken("victim");
        // Tamper with payload or signature (flip character in signature)
        String tamperedToken = validToken.substring(0, validToken.length() - 5) + "abcde";

        boolean isValid = jwtUtils.validateJwtToken(tamperedToken);
        assertFalse(isValid, "Tampered JWT token signature MUST NOT validate successfully");
    }

    @Test
    @DisplayName("JWT Security: Malformed or empty token returns false without unhandled exceptions")
    void testValidateJwtToken_Malformed_ReturnsFalse() {
        assertFalse(jwtUtils.validateJwtToken("not.a.valid.jwt.token"));
        assertFalse(jwtUtils.validateJwtToken(""));
        assertFalse(jwtUtils.validateJwtToken("header.payload")); // missing signature
    }

    // ---------------------------------------------------------------------------------------------
    // 7. Rate Limiting: Sensitive Authentication Endpoints
    // ---------------------------------------------------------------------------------------------
    @Test
    @DisplayName("Rate Limiting: Exceeding signin threshold returns 429 Too Many Requests")
    void testRateLimiter_ExceedingLimit_Returns429() throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("WrongPassword123!");
        String jsonPayload = objectMapper.writeValueAsString(loginRequest);

        // Signin limit is 15 requests per minute
        for (int i = 0; i < 15; i++) {
            mockMvc.perform(post("/api/auth/signin")
                            .header("X-Forwarded-For", "198.51.100.1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(jsonPayload));
        }

        // 16th request must be blocked by RateLimitingFilter with HTTP 429
        mockMvc.perform(post("/api/auth/signin")
                        .header("X-Forwarded-For", "198.51.100.1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().string("Retry-After", "60"))
                .andExpect(jsonPath("$.status").value(429))
                .andExpect(jsonPath("$.error").value("Too Many Requests"));
    }

    // ---------------------------------------------------------------------------------------------
    // 8. Server-Side DTO Validation: Negative amounts and missing required fields
    // ---------------------------------------------------------------------------------------------
    @Test
    @DisplayName("DTO Validation: Budget request with negative totalAmount returns 400 Bad Request")
    void testBudgetValidation_NegativeAmount_Returns400() throws Exception {
        BudgetRequest request = new BudgetRequest();
        request.setTripId(100L);
        request.setTotalAmount(-500.0);

        mockMvc.perform(post("/api/budget")
                        .with(user(victimPrincipal))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @DisplayName("DTO Validation: Expense request with negative amount returns 400 Bad Request")
    void testExpenseValidation_NegativeAmount_Returns400() throws Exception {
        ExpenseRequest request = new ExpenseRequest();
        request.setTripId(100L);
        request.setTitle("Dinner");
        request.setAmount(-150.0);
        request.setCategory("FOOD");
        request.setDate(LocalDate.now());

        mockMvc.perform(post("/api/expenses")
                        .with(user(victimPrincipal))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @DisplayName("DTO Validation: Itinerary request with missing date returns 400 Bad Request")
    void testItineraryValidation_MissingDate_Returns400() throws Exception {
        ItineraryRequest request = new ItineraryRequest();
        request.setTripId(100L);
        request.setDate(null); // Missing required date
        request.setNotes("Notes without date");

        mockMvc.perform(post("/api/itineraries")
                        .with(user(victimPrincipal))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @DisplayName("DTO Validation: Activity request with blank title returns 400 Bad Request")
    void testActivityValidation_BlankTitle_Returns400() throws Exception {
        ActivityRequest request = new ActivityRequest();
        request.setItineraryId(500L);
        request.setTitle("   "); // Blank title
        request.setCost(20.0);

        mockMvc.perform(post("/api/activities")
                        .with(user(victimPrincipal))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @DisplayName("DTO Validation: TripShare request with invalid email returns 400 Bad Request")
    void testTripShareValidation_InvalidEmail_Returns400() throws Exception {
        TripShareRequest request = new TripShareRequest();
        request.setTripId(100L);
        request.setEmail("not-a-valid-email");
        request.setPermission("VIEW");

        mockMvc.perform(post("/api/trip-shares")
                        .with(user(victimPrincipal))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    // ---------------------------------------------------------------------------------------------
    // 9. Profile Email Uniqueness & Disposable Email Validation
    // ---------------------------------------------------------------------------------------------
    @Test
    @DisplayName("Profile Security: Updating profile with an email already belonging to another user returns 400")
    void testUpdateProfile_DuplicateEmail_Returns400() throws Exception {
        when(userRepository.findById(99L)).thenReturn(Optional.of(attackerUser));
        when(userRepository.findByEmailIgnoreCase("victim@example.com")).thenReturn(Optional.of(victimUser));

        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setFirstName("Attacker");
        request.setLastName("User");
        request.setEmail("victim@example.com"); // already used by victim

        mockMvc.perform(put("/api/user/profile")
                        .with(user(attackerPrincipal))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Error: Email is already in use!"));
    }

    @Test
    @DisplayName("Profile Security: Updating profile with a disposable email returns 400")
    void testUpdateProfile_DisposableEmail_Returns400() throws Exception {
        when(userRepository.findById(99L)).thenReturn(Optional.of(attackerUser));
        when(userRepository.findByEmailIgnoreCase("attacker@mailinator.com")).thenReturn(Optional.empty());
        when(disposableEmailService.isDisposableEmail("attacker@mailinator.com")).thenReturn(true);

        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setFirstName("Attacker");
        request.setLastName("User");
        request.setEmail("attacker@mailinator.com");

        mockMvc.perform(put("/api/user/profile")
                        .with(user(attackerPrincipal))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Error: Disposable email addresses are not allowed. Please use a permanent email address."));
    }

    // ---------------------------------------------------------------------------------------------
    // 10. Expense Splits Authorization & IDOR Hardening (GET /api/expenses/{expenseId}/splits)
    // ---------------------------------------------------------------------------------------------
    @Test
    @DisplayName("Splits Security: Unauthenticated request to get expense splits returns 401 Unauthorized")
    void testGetExpenseSplits_Unauthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/expenses/200/splits"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Splits Security: Request for nonexistent expense returns 404 Not Found")
    void testGetExpenseSplits_NonExistentExpense_Returns404() throws Exception {
        when(expenseRepository.findById(9999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/expenses/9999/splits")
                        .with(user(victimPrincipal)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    @DisplayName("Splits Security: Attacker querying victim's expense splits returns 403 Forbidden")
    void testGetExpenseSplits_UnauthorizedAttacker_Returns403() throws Exception {
        when(expenseRepository.findById(200L)).thenReturn(Optional.of(victimExpense));
        when(tripRepository.findById(100L)).thenReturn(Optional.of(victimTrip));
        when(tripShareService.hasAccess(100L, 99L)).thenReturn(false);
        when(groupRepository.existsByTripIdAndMembersId(100L, 99L)).thenReturn(false);

        mockMvc.perform(get("/api/expenses/200/splits")
                        .with(user(attackerPrincipal)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("Splits Security: Authorized trip owner querying expense splits returns 200 OK")
    void testGetExpenseSplits_AuthorizedOwner_Returns200() throws Exception {
        when(expenseRepository.findById(200L)).thenReturn(Optional.of(victimExpense));
        when(tripRepository.findById(100L)).thenReturn(Optional.of(victimTrip));
        ExpenseSplit split = new ExpenseSplit();
        split.setId(1L);
        split.setExpense(victimExpense);
        split.setUser(victimUser);
        split.setAmount(new BigDecimal("100.00"));
        split.setSettled(true);

        when(expenseSplitRepository.findByExpenseIdWithUser(200L)).thenReturn(List.of(split));

        mockMvc.perform(get("/api/expenses/200/splits")
                        .with(user(victimPrincipal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].userId").value(10L))
                .andExpect(jsonPath("$[0].amount").value(100.00));
    }
}
