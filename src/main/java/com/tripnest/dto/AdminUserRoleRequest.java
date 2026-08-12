package com.tripnest.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import java.util.Set;

@Data
public class AdminUserRoleRequest {

    @NotEmpty(message = "Roles must not be empty")
    private Set<String> roles;
}
