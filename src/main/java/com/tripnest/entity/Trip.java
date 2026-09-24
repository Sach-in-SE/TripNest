package com.tripnest.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = "user")
@Entity
@Table(name = "trips")
public class Trip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @NotBlank
    @Size(max = 100)
    private String title;

    @Size(max = 500)
    private String description;

    @NotBlank
    @Size(max = 100)
    private String destination;

    private LocalDate startDate;
    private LocalDate endDate;

    private Integer numberOfTravelers;
    private Double budget;

    @Size(max = 1000)
    @Column(name = "cover_image_url", length = 1000)
    private String coverImageUrl;
    
    // Individual reminder flags for duplicate prevention
    private Boolean reminder7DaySent = false;
    private Boolean reminder3DaySent = false;
    private Boolean reminder24HourSent = false;
    private Boolean tripStartedSent = false;
    private Boolean tripCompletedSent = false;

    @Enumerated(EnumType.STRING)
    private TripStatus status = TripStatus.PLANNING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @OneToMany(mappedBy = "trip", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<com.tripnest.model.Settlement> settlements = new java.util.ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}