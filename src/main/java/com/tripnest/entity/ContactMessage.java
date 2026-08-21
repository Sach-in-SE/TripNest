package com.tripnest.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(
    name = "contact_messages",
    indexes = {
        @Index(name = "idx_contact_status", columnList = "status"),
        @Index(name = "idx_contact_created_at", columnList = "created_at"),
        @Index(name = "idx_contact_email", columnList = "email"),
        @Index(name = "idx_contact_category", columnList = "category"),
        @Index(name = "idx_contact_user_id", columnList = "user_id")
    }
)
public class ContactMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(min = 2, max = 100)
    @Column(nullable = false, length = 100)
    private String name;

    @NotBlank
    @Email
    @Size(max = 100)
    @Column(nullable = false, length = 100)
    private String email;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ContactCategory category;

    @NotBlank
    @Size(min = 3, max = 200)
    @Column(nullable = false, length = 200)
    private String subject;

    @NotBlank
    @Size(min = 10, max = 3000)
    @Column(nullable = false, length = 3000)
    private String message;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ContactMessageStatus status = ContactMessageStatus.NEW;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = ContactMessageStatus.NEW;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
