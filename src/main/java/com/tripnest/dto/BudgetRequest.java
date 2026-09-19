package com.tripnest.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class BudgetRequest {

    @NotNull(message = "Total amount is required")
    @Positive(message = "Total amount must be positive")
    private Double totalAmount;

    @Size(max = 10, message = "Currency code cannot exceed 10 characters")
    private String currency;

    @NotNull(message = "Trip ID is required")
    private Long tripId;
}