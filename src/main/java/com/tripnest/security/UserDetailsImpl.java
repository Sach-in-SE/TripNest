package com.tripnest.security;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.tripnest.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

public class UserDetailsImpl implements UserDetails {

    private Long id;
    private String username;
    private String email;

    @JsonIgnore
    private String password;

    private boolean enabled;

    private Collection<? extends GrantedAuthority> authorities;

    public UserDetailsImpl(Long id, String username, String email,
            String password,
            Collection<? extends GrantedAuthority> authorities) {
        this(id, username, email, password, true, authorities);
    }

    public UserDetailsImpl(Long id, String username, String email,
            String password, boolean enabled,
            Collection<? extends GrantedAuthority> authorities) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.password = password;
        this.enabled = enabled;
        this.authorities = authorities;
    }

    public static UserDetailsImpl build(User user) {
        if (user == null) {
            return null;
        }
        java.util.Set<GrantedAuthority> authorities = new java.util.LinkedHashSet<>();
        try {
            if (user.getRoles() != null && !user.getRoles().isEmpty()) {
                for (com.tripnest.entity.Role role : user.getRoles()) {
                    if (role != null && role.getName() != null) {
                        authorities.add(new SimpleGrantedAuthority(role.getName().name()));
                        if (role.getName() == com.tripnest.entity.ERole.ROLE_USER) {
                            authorities.add(new SimpleGrantedAuthority(com.tripnest.entity.ERole.ROLE_TRAVELER.name()));
                        } else if (role.getName() == com.tripnest.entity.ERole.ROLE_TRAVELER) {
                            authorities.add(new SimpleGrantedAuthority(com.tripnest.entity.ERole.ROLE_USER.name()));
                        }
                    }
                }
            }
        } catch (Exception ignored) {
            // Guard against uninitialized collections or closed sessions
        }

        if (authorities.isEmpty()) {
            authorities.add(new SimpleGrantedAuthority(com.tripnest.entity.ERole.ROLE_USER.name()));
            authorities.add(new SimpleGrantedAuthority(com.tripnest.entity.ERole.ROLE_TRAVELER.name()));
        }

        return new UserDetailsImpl(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getPassword(),
                user.isEnabled(),
                authorities);
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}