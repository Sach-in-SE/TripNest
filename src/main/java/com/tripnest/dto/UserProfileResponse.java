package com.tripnest.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class UserProfileResponse {
    private Long id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private String bio;
    private String country;
    private String state;
    private String city;
    private LocalDate dateOfBirth;
    private String gender;
    private String occupation;
    private boolean emailVerified;
    private LocalDateTime createdAt;
    private String travelStyle;
    private String preferredTransport;
    private String accommodationPreference;
    private String dreamDestination;
    private String favoriteDestination;
    private boolean passportHolder;
    private String emergencyContactName;
    private String emergencyContactRelationship;
    private String emergencyContactPhone;
    private String github;
    private String linkedin;
    private String instagram;
    private String portfolio;
    private String provider;
    private boolean enabled;
    private List<String> roles;
}