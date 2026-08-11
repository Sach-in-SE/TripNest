package com.tripnest.security;

import com.tripnest.entity.ERole;
import com.tripnest.entity.Role;
import com.tripnest.entity.User;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class UserDetailsImplTest {

    @Test
    void testEnabledUserBuild() {
        User user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setPassword("encodedPassword");
        user.setEnabled(true);

        Role role = new Role();
        role.setId(1L);
        role.setName(ERole.ROLE_TRAVELER);
        user.setRoles(Set.of(role));

        UserDetailsImpl userDetails = UserDetailsImpl.build(user);

        assertTrue(userDetails.isEnabled());
        assertEquals("testuser", userDetails.getUsername());
        assertEquals("test@example.com", userDetails.getEmail());
        assertEquals(1L, userDetails.getId());
    }

    @Test
    void testDisabledUserBuild() {
        User user = new User();
        user.setId(2L);
        user.setUsername("disableduser");
        user.setEmail("disabled@example.com");
        user.setPassword("encodedPassword");
        user.setEnabled(false);

        Role role = new Role();
        role.setId(1L);
        role.setName(ERole.ROLE_TRAVELER);
        user.setRoles(Set.of(role));

        UserDetailsImpl userDetails = UserDetailsImpl.build(user);

        assertFalse(userDetails.isEnabled());
    }
}
