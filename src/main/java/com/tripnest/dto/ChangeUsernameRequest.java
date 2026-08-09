package com.tripnest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChangeUsernameRequest {

    @NotBlank
    @Size(min = 3, max = 50)
    private String username;
}