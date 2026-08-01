package com.tripnest.dto;

import lombok.Data;

@Data
public class BudgetRequest {
    private Double totalAmount;
    private String currency;
    private Long tripId;
}