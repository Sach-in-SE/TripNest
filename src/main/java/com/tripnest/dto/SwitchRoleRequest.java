package com.tripnest.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SwitchRoleRequest {

    @NotBlank(message = "Role is required")
    private String role;
}
