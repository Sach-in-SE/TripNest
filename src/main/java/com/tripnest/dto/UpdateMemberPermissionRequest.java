package com.tripnest.dto;

import lombok.Data;

@Data
public class UpdateMemberPermissionRequest {
    private String tripPermission; // "VIEW" or "EDIT"
}