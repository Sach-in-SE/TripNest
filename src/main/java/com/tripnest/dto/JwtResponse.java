package com.tripnest.dto;

import lombok.Data;
import java.util.List;

@Data
public class JwtResponse {
    private String token;
    private String type = "Bearer";
    private Long id;
    private String username;
    private String email;
    private List<String> roles;
    private boolean passwordChangeRequired = false;

    public JwtResponse(String token, Long id, String username, String email, List<String> roles) {
        this(token, id, username, email, roles, false);
    }

    public JwtResponse(String token, Long id, String username, String email, List<String> roles, boolean passwordChangeRequired) {
        this.token = token;
        this.id = id;
        this.username = username;
        this.email = email;
        this.roles = roles;
        this.passwordChangeRequired = passwordChangeRequired;
    }
}