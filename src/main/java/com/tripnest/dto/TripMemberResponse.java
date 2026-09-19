package com.tripnest.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TripMemberResponse {
    private Long userId;
    private String username;
    private String email;
    private String role; // OWNER, COLLABORATOR, MEMBER
}
