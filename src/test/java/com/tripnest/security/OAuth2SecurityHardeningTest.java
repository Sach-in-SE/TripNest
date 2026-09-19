package com.tripnest.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tripnest.dto.JwtResponse;
import com.tripnest.dto.OAuth2ExchangeRequest;
import com.tripnest.entity.ERole;
import com.tripnest.entity.Role;
import com.tripnest.entity.User;
import com.tripnest.repository.RoleRepository;
import com.tripnest.repository.UserRepository;
import com.tripnest.security.oauth2.OAuth2AuthenticationFailureHandler;
import com.tripnest.security.oauth2.OAuth2AuthenticationSuccessHandler;
import com.tripnest.security.oauth2.OAuth2ExchangeCodeService;
import com.tripnest.tripnest.TripnestApplication;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.*;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(classes = TripnestApplication.class)
@AutoConfigureMockMvc
public class OAuth2SecurityHardeningTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private OAuth2ExchangeCodeService exchangeCodeService;

    @Autowired
    private OAuth2AuthenticationSuccessHandler successHandler;

    @Autowired
    private OAuth2AuthenticationFailureHandler failureHandler;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    private User testOAuthUser;

    @BeforeEach
    void setUp() {
        exchangeCodeService.reset();

        Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                .orElseGet(() -> {
                    Role r = new Role();
                    r.setName(ERole.ROLE_USER);
                    return roleRepository.save(r);
                });

        testOAuthUser = userRepository.findByEmail("oauth2_security_user@example.com")
                .orElseGet(() -> {
                    User u = new User();
                    u.setUsername("oauth2_security_user");
                    u.setEmail("oauth2_security_user@example.com");
                    u.setPassword("Password@123");
                    u.setFirstName("OAuth");
                    u.setLastName("User");
                    u.setEnabled(true);
                    u.setEmailVerified(true);
                    Set<Role> roles = new HashSet<>();
                    roles.add(userRole);
                    u.setRoles(roles);
                    return userRepository.save(u);
                });
    }

    @Test
    @DisplayName("OAuth2 Success Handler issues short-lived exchange code and NEVER exposes JWT in redirect URL")
    void testSuccessHandlerIssuesExchangeCodeWithoutJwt() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        Map<String, Object> attributes = new HashMap<>();
        attributes.put("email", testOAuthUser.getEmail());
        attributes.put("name", "OAuth Security Traveler");
        attributes.put("sub", "google-sub-id-12345");

        OAuth2User principal = new DefaultOAuth2User(
                Collections.singleton(new SimpleGrantedAuthority("ROLE_USER")),
                attributes,
                "email"
        );

        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(principal);

        successHandler.onAuthenticationSuccess(request, response, auth);

        String redirectedUrl = response.getRedirectedUrl();
        assertNotNull(redirectedUrl, "Redirect URL must not be null");

        // Verify redirect URL contains ?code=tn_oec_
        assertTrue(redirectedUrl.contains("/oauth2/redirect?code="), "URL must route to /oauth2/redirect?code=...");
        assertTrue(redirectedUrl.contains("code=tn_oec_"), "Exchange code must start with tn_oec_ prefix");

        // Strictly verify NO JWT or token exposure in redirect URL
        assertFalse(redirectedUrl.contains("token="), "Redirect URL must NEVER contain token=");
        assertFalse(redirectedUrl.contains("jwt="), "Redirect URL must NEVER contain jwt=");
        assertFalse(redirectedUrl.contains("access_token="), "Redirect URL must NEVER contain access_token=");
        assertFalse(redirectedUrl.contains("Bearer"), "Redirect URL must NEVER contain Bearer");
        assertFalse(redirectedUrl.matches(".*eyJ[a-zA-Z0-9_-]+\\..*"), "Redirect URL must NEVER contain JWT format string");
    }

    @Test
    @DisplayName("Exchange code is strictly single-use (replay attack fails)")
    void testExchangeCodeIsSingleUse() {
        String code = exchangeCodeService.createExchangeCode(testOAuthUser.getUsername());
        assertNotNull(code);
        assertTrue(code.startsWith("tn_oec_"));

        // First consume: MUST succeed and return username
        String consumedUser = exchangeCodeService.consumeExchangeCode(code);
        assertEquals(testOAuthUser.getUsername(), consumedUser);

        // Second consume (Replay): MUST fail (return null)
        String replayedUser = exchangeCodeService.consumeExchangeCode(code);
        assertNull(replayedUser, "Replaying an exchange code must immediately return null");
    }

    @Test
    @DisplayName("POST /api/auth/oauth2/exchange exchanges valid code for JWT and user details")
    void testExchangeEndpointSuccess() throws Exception {
        String code = exchangeCodeService.createExchangeCode(testOAuthUser.getUsername());

        OAuth2ExchangeRequest request = new OAuth2ExchangeRequest(code);

        MvcResult result = mockMvc.perform(post("/api/auth/oauth2/exchange")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", not(emptyOrNullString())))
                .andExpect(jsonPath("$.username", is(testOAuthUser.getUsername())))
                .andExpect(jsonPath("$.email", is(testOAuthUser.getEmail())))
                .andExpect(jsonPath("$.roles", hasItem("ROLE_USER")))
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        JwtResponse jwtResponse = objectMapper.readValue(responseBody, JwtResponse.class);
        assertNotNull(jwtResponse.getToken());

        // Attempting to reuse the exact same code must be rejected with 401
        mockMvc.perform(post("/api/auth/oauth2/exchange")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message", containsString("Invalid or expired OAuth exchange code")));
    }

    @Test
    @DisplayName("POST /api/auth/oauth2/exchange rejects invalid or forged exchange code with 401")
    void testExchangeEndpointRejectsForgedCode() throws Exception {
        OAuth2ExchangeRequest forgedRequest = new OAuth2ExchangeRequest("tn_oec_forged_code_random_string_12345678");

        mockMvc.perform(post("/api/auth/oauth2/exchange")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(forgedRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message", containsString("Invalid or expired OAuth exchange code")));
    }

    @Test
    @DisplayName("POST /api/auth/oauth2/exchange validates input and rejects malformed code with 400")
    void testExchangeEndpointValidatesInput() throws Exception {
        OAuth2ExchangeRequest shortRequest = new OAuth2ExchangeRequest("short");

        mockMvc.perform(post("/api/auth/oauth2/exchange")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(shortRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("OAuth2 Failure Handler redirects cleanly to /login?oauth_error=true without exposing internals")
    void testFailureHandlerRedirectsCleanly() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        OAuth2AuthenticationException exception = new OAuth2AuthenticationException(
                new OAuth2Error("access_denied", "The user denied OAuth authorization", null)
        );

        failureHandler.onAuthenticationFailure(request, response, exception);

        String redirectedUrl = response.getRedirectedUrl();
        assertNotNull(redirectedUrl);
        assertTrue(redirectedUrl.contains("/login?oauth_error=true"));
        assertFalse(redirectedUrl.contains("stackTrace"));
        assertFalse(redirectedUrl.contains("exception"));
    }

    @Test
    @DisplayName("OAuth2 authenticated user maintains RBAC isolation and cannot access Admin APIs")
    void testOAuthUserCannotAccessAdminEndpoints() throws Exception {
        String code = exchangeCodeService.createExchangeCode(testOAuthUser.getUsername());
        OAuth2ExchangeRequest request = new OAuth2ExchangeRequest(code);

        MvcResult result = mockMvc.perform(post("/api/auth/oauth2/exchange")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        JwtResponse jwtResponse = objectMapper.readValue(result.getResponse().getContentAsString(), JwtResponse.class);
        String jwtToken = jwtResponse.getToken();

        // OAuth user can access regular user profile
        mockMvc.perform(get("/api/user/profile")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username", is(testOAuthUser.getUsername())));

        // OAuth user CANNOT access platform admin endpoints (strictly 403 Forbidden)
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isForbidden());
    }
}
