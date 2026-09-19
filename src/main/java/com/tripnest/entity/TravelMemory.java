package com.tripnest.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.hibernate.annotations.BatchSize;

@Data
@Entity
@Table(
    name = "travel_memories",
    indexes = {
        @Index(name = "idx_memory_user_id", columnList = "user_id"),
        @Index(name = "idx_memory_visibility", columnList = "visibility"),
        @Index(name = "idx_memory_trip_id", columnList = "trip_id"),
        @Index(name = "idx_memory_dest_id", columnList = "destination_id"),
        @Index(name = "idx_memory_dest_vis_created", columnList = "destination_id, visibility, createdAt")
    }
)
public class TravelMemory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 150)
    @Column(nullable = false, length = 150)
    private String title;

    @Size(max = 2000)
    @Column(length = 2000)
    private String caption;

    @Size(max = 200)
    @Column(length = 200)
    private String locationName;

    @Column(length = 500)
    private String imageUrl;

    @Column(length = 255)
    private String storedFileName;

    @OneToMany(
        mappedBy = "travelMemory",
        cascade = CascadeType.ALL,
        orphanRemoval = true,
        fetch = FetchType.LAZY
    )
    @OrderBy("displayOrder ASC")
    @BatchSize(size = 50)
    private List<TravelMemoryImage> images = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MemoryVisibility visibility = MemoryVisibility.PRIVATE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id")
    private Trip trip;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destination_id")
    private Destination destination;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

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
