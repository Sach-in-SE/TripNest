package com.tripnest.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class BudgetResponse {
    private Long id;
    private Double totalAmount;
    private Double spentAmount;
    private Double remainingAmount;
    private String currency;
    private Long tripId;
    private String tripTitle;
    private Double percentageUsed;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}