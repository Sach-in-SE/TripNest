package com.tripnest.dto;

import lombok.Data;

@Data
public class TripShareRequest {
    private Long tripId;
    private String email;
    private String permission; // "VIEW" or "EDIT"
}