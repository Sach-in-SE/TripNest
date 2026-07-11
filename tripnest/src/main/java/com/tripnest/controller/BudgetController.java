package com.tripnest.controller;

import com.tripnest.dto.BudgetRequest;
import com.tripnest.dto.BudgetResponse;
import com.tripnest.security.UserDetailsImpl;
import com.tripnest.service.BudgetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/budget")
public class BudgetController {

    @Autowired
    private BudgetService budgetService;

    @PostMapping
    public ResponseEntity<?> createOrUpdateBudget(@RequestBody BudgetRequest request) {
        UserDetailsImpl userDetails = getCurrentUser();
        BudgetResponse response = budgetService.createOrUpdateBudget(request, userDetails.getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/trip/{tripId}")
    public ResponseEntity<?> getBudgetByTrip(@PathVariable Long tripId) {
        UserDetailsImpl userDetails = getCurrentUser();
        BudgetResponse response = budgetService.getBudgetByTripId(tripId, userDetails.getId());
        return ResponseEntity.ok(response);
    }

    private UserDetailsImpl getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (UserDetailsImpl) authentication.getPrincipal();
    }
}
