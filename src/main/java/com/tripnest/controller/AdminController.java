package com.tripnest.controller;

import com.tripnest.dto.AdminStatsResponse;
import com.tripnest.dto.MessageResponse;
import com.tripnest.service.AdminStatsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private AdminStatsService adminStatsService;

    @GetMapping("/test")
    public ResponseEntity<?> testAdminAccess() {
        return ResponseEntity.ok(new MessageResponse("Admin access confirmed"));
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getAdminStats() {
        AdminStatsResponse stats = adminStatsService.getAdminStats();
        return ResponseEntity.ok(stats);
    }
}
