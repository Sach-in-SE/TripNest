package com.tripnest.dto;

import lombok.Data;
import java.util.List;

@Data
public class UserProfileResponse {
    private Long id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private List<String> roles;
}