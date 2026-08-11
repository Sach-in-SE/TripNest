package com.tripnest.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminResetPasswordResponse {

    private Long userId;
    private String username;
    private String temporaryPassword;
    private LocalDateTime temporaryPasswordExpiry;
    private String message;
}
