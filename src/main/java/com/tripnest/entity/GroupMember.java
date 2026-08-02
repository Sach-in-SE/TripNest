package com.tripnest.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "group_memberships",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"group_id", "user_id"})
        })
public class GroupMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private TravelGroup travelGroup;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invited_by_user_id")
    private User invitedBy;

    @Enumerated(EnumType.STRING)
    private GroupRole role = GroupRole.MEMBER;

    @Enumerated(EnumType.STRING)
    private GroupInvitationStatus status = GroupInvitationStatus.PENDING;

    @Enumerated(EnumType.STRING)
    private SharePermission tripPermission = SharePermission.VIEW;

    @Column(nullable = false)
    private LocalDateTime invitedAt;

    @Column(name = "joined_at", nullable = true)
    private LocalDateTime joinedAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (invitedAt == null) {
            invitedAt = LocalDateTime.now();
        }
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}