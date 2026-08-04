package com.tripnest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.AssertTrue;
import lombok.Data;
import java.time.LocalDate;

@Data
public class TripRequest {

    @NotBlank
    @Size(max = 100)
    private String title;

    @Size(max = 500)
    private String description;

    @NotBlank
    @Size(max = 100)
    private String destination;

    private LocalDate startDate;
    private LocalDate endDate;
    private Integer numberOfTravelers;
    private Double budget;
    private String status;

    @AssertTrue(message = "End date must be on or after start date")
    private boolean isEndDateValid() {
        if (startDate == null || endDate == null) {
            return true; // Allow null dates (they'll be validated separately if required)
        }
        return !endDate.isBefore(startDate);
    }
}