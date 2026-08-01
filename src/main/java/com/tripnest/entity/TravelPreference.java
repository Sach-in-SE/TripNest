package com.tripnest.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Data
@Entity
@Table(name = "travel_preferences")
public class TravelPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    @ElementCollection
    @CollectionTable(name = "preference_trip_types", joinColumns = @JoinColumn(name = "preference_id"))
    @Column(name = "trip_type")
    private Set<String> preferredTripTypes = new HashSet<>();

    @Column(length = 20)
    private String preferredBudgetRange;

    @Column(length = 20)
    private String preferredTravelStyle;

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
