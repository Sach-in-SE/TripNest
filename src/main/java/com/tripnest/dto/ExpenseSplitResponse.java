package com.tripnest.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseSplitResponse {
    private Long id;
    private Long userId;
    private String username;
    private String email;
    private BigDecimal amount;
    private boolean isSettled;
    private LocalDateTime settledAt;
}
