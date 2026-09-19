package com.tripnest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.time.LocalDate;

@Data
public class ExpenseRequest {

    @NotBlank(message = "Expense title is required")
    @Size(max = 100, message = "Title cannot exceed 100 characters")
    private String title;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private Double amount;

    @NotBlank(message = "Category is required")
    private String category;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    @NotNull(message = "Expense date is required")
    private LocalDate date;

    @NotNull(message = "Trip ID is required")
    private Long tripId;

    private java.util.List<Long> splitUserIds;
}