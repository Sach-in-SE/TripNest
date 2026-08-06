package com.tripnest.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;
import java.time.LocalDate;

@Data
public class UpdateProfileRequest {

    @Size(max = 50)
    private String firstName;

    @Size(max = 50)
    private String lastName;

    @Size(max = 100)
    private String email;

    @Size(max = 15)
    private String phone;

    @Size(max = 300)
    private String bio;

    @Size(max = 100)
    private String country;

    @Size(max = 100)
    private String state;

    @Size(max = 100)
    private String city;

    private LocalDate dateOfBirth;

    @Size(max = 20)
    private String gender;

    @Size(max = 100)
    private String occupation;

    @Size(max = 50)
    private String travelStyle;

    @Size(max = 50)
    private String preferredTransport;

    @Size(max = 50)
    private String accommodationPreference;

    @Size(max = 100)
    private String dreamDestination;

    @Size(max = 100)
    private String favoriteDestination;

    private Boolean passportHolder;

    @Size(max = 100)
    private String emergencyContactName;

    @Size(max = 50)
    private String emergencyContactRelationship;

    @Size(max = 15)
    private String emergencyContactPhone;

    @Size(max = 500)
    private String github;

    @Size(max = 500)
    private String linkedin;

    @Size(max = 500)
    private String instagram;

    @Size(max = 500)
    private String portfolio;
}