package com.tripnest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OAuth2ExchangeRequest {

    @NotBlank(message = "Exchange code is required")
    @Size(min = 16, max = 128, message = "Invalid exchange code length")
    private String code;
}
