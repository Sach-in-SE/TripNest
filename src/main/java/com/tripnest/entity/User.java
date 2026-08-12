package com.tripnest.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Data
@Entity
@Table(name = "users",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "username"),
                @UniqueConstraint(columnNames = "email")
        })
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 50)
    private String username;

    @NotBlank
    @Size(max = 100)
    @Email
    private String email;

    @NotBlank
    @Size(max = 120)
    private String password;

    @Size(max = 50)
    private String firstName;

    @Size(max = 50)
    private String lastName;

    @Size(max = 15)
    private String phone;

    @Size(max = 500)
    private String profilePictureUrl;

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

    private boolean emailVerified = false;

    private LocalDateTime createdAt;

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

    private boolean passportHolder = false;

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

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id"))
    private Set<Role> roles = new HashSet<>();

    private boolean enabled = true;
    private boolean passwordChangeRequired = false;
    private LocalDateTime temporaryPasswordExpiry;

    @Enumerated(EnumType.STRING)
    private AuthProvider provider = AuthProvider.LOCAL;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}