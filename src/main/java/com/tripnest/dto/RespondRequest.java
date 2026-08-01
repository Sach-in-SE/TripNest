package com.tripnest.dto;

import lombok.Data;

@Data
public class RespondRequest {
    private String action; // "ACCEPT" or "DECLINE"
}
