package com.tripnest.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class ExpenseRequest {
    private String title;
    private Double amount;
    private String category;
    private String description;
    private LocalDate date;
    private Long tripId;
}