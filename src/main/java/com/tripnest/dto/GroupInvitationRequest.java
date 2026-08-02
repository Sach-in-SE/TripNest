package com.tripnest.dto;

import lombok.Data;

@Data
public class GroupInvitationRequest {
    private String email;
    private Boolean shareTrip;
    private String tripPermission; // "VIEW" or "EDIT"
}