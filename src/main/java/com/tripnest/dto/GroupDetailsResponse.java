package com.tripnest.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class GroupDetailsResponse {
    private Long id;
    private String name;
    private String description;
    private Long tripId;
    private String tripTitle;
    private String tripDestination;
    private LocalDate tripStartDate;
    private LocalDate tripEndDate;
    private Double tripBudget;
    private String createdByUsername;
    private Long createdById;
    private String currentUserRole;
    private boolean canEditTrip;
    private boolean canInviteMembers;
    private boolean canRemoveMembers;
    private boolean canDeleteGroup;
    private boolean canLeaveGroup;
    private List<GroupMemberResponse> members;
    private List<GroupMemberResponse> pendingInvitations;
}