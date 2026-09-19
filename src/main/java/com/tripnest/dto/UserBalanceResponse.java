package com.tripnest.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserBalanceResponse {
    private Long userId;
    private String username;
    private String email;
    private BigDecimal totalPaid;
    private BigDecimal totalShareOwed;
    private BigDecimal settlementsPaid;
    private BigDecimal settlementsReceived;
    private BigDecimal netBalance;
    private String status; // OWES, IS_OWED, SETTLED
}
