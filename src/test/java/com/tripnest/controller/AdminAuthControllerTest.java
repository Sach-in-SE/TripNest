package com.tripnest.controller;

import com.tripnest.dto.AdminLoginRequest;
import com.tripnest.entity.ERole;
import com.tripnest.entity.Role;
import com.tripnest.entity.User;
import com.tripnest.repository.UserRepository;
import com.tripnest.security.JwtUtils;
import com.tripnest.security.UserDetailsImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminAuthControllerTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtUtils jwtUtils;

    @InjectMocks
    private AdminAuthController adminAuthController;

    private User adminUser;

    @BeforeEach
    void setUp() {
        Role adminRole = new Role();
        adminRole.setName(ERole.ROLE_ADMIN);

        adminUser = new User();
        adminUser.setId(1L);
        adminUser.setUsername("admin");
        adminUser.setEmail("admin@tripnest.com");
        adminUser.setPassword("encodedDevPassword");
        adminUser.setEnabled(true);
        Set<Role> roles = new HashSet<>();
        roles.add(adminRole);
        adminUser.setRoles(roles);
    }

    @Test
    void testAuthenticateAdmin_Success() {
        AdminLoginRequest loginRequest = new AdminLoginRequest();
        loginRequest.setEmail("admin@tripnest.com");
        loginRequest.setPassword("DevAdminPassword123!");

        when(userRepository.findByEmailIgnoreCase("admin@tripnest.com")).thenReturn(Optional.of(adminUser));

        UserDetailsImpl userDetails = UserDetailsImpl.build(adminUser);
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(authentication.getName()).thenReturn("admin");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(jwtUtils.generateJwtToken("admin")).thenReturn("mockJwtToken");

        ResponseEntity<?> response = adminAuthController.authenticateAdmin(loginRequest);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    void testAuthenticateAdmin_InvalidPassword_Returns401() {
        AdminLoginRequest loginRequest = new AdminLoginRequest();
        loginRequest.setEmail("admin@tripnest.com");
        loginRequest.setPassword("WrongPassword!");

        when(userRepository.findByEmailIgnoreCase("admin@tripnest.com")).thenReturn(Optional.of(adminUser));
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        ResponseEntity<?> response = adminAuthController.authenticateAdmin(loginRequest);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    void testAuthenticateAdmin_UserNotFound_Returns401() {
        AdminLoginRequest loginRequest = new AdminLoginRequest();
        loginRequest.setEmail("nonexistent@tripnest.com");
        loginRequest.setPassword("DevAdminPassword123!");

        when(userRepository.findByEmailIgnoreCase("nonexistent@tripnest.com")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("nonexistent@tripnest.com")).thenReturn(Optional.empty());

        ResponseEntity<?> response = adminAuthController.authenticateAdmin(loginRequest);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    void testAuthenticateAdmin_UserWithoutAdminRole_Returns403() {
        AdminLoginRequest loginRequest = new AdminLoginRequest();
        loginRequest.setEmail("traveler@tripnest.com");
        loginRequest.setPassword("DevAdminPassword123!");

        Role travelerRole = new Role();
        travelerRole.setName(ERole.ROLE_TRAVELER);

        User travelerUser = new User();
        travelerUser.setId(2L);
        travelerUser.setUsername("traveler");
        travelerUser.setEmail("traveler@tripnest.com");
        travelerUser.setPassword("encodedTravelerPassword");
        travelerUser.setEnabled(true);
        Set<Role> roles = new HashSet<>();
        roles.add(travelerRole);
        travelerUser.setRoles(roles);

        when(userRepository.findByEmailIgnoreCase("traveler@tripnest.com")).thenReturn(Optional.of(travelerUser));

        UserDetailsImpl userDetails = UserDetailsImpl.build(travelerUser);
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);

        ResponseEntity<?> response = adminAuthController.authenticateAdmin(loginRequest);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
    }
}
