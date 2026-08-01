package com.tripnest.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class ExpenseResponse {
    private Long id;
    private String title;
    private Double amount;
    private String category;
    private String description;
    private LocalDate date;
    private Long tripId;
    private String tripTitle;
    private Long userId;
    private String username;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}