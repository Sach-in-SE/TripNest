package com.tripnest.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class GroupMemberResponse {
    private Long id;
    private Long groupId;
    private String groupName;
    private Long tripId;
    private String tripTitle;
    private Long userId;
    private String name;
    private String email;
    private String role;
    private String status;
    private LocalDateTime invitedAt;
    private LocalDateTime joinedAt;
    private String invitedByUsername;
}