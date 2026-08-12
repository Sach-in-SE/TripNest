package com.tripnest.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class AdminUserResponse {

    private Long id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private String profilePictureUrl;
    private String bio;
    private String country;
    private String state;
    private String city;
    private boolean enabled;
    private boolean emailVerified;
    private boolean passwordChangeRequired;
    private LocalDateTime temporaryPasswordExpiry;
    private String provider;
    private List<String> roles;
    private LocalDateTime createdAt;
}
