package com.tripnest.controller;

import com.tripnest.dto.ExpenseRequest;
import com.tripnest.dto.ExpenseResponse;
import com.tripnest.dto.MessageResponse;
import com.tripnest.security.UserDetailsImpl;
import com.tripnest.service.ExpenseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    @Autowired
    private ExpenseService expenseService;

    @PostMapping
    public ResponseEntity<?> createExpense(@RequestBody ExpenseRequest request) {
        UserDetailsImpl userDetails = getCurrentUser();
        ExpenseResponse response = expenseService.createExpense(request, userDetails.getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/trip/{tripId}")
    public ResponseEntity<?> getTripExpenses(@PathVariable Long tripId) {
        UserDetailsImpl userDetails = getCurrentUser();
        List<ExpenseResponse> expenses = expenseService.getTripExpenses(tripId, userDetails.getId());
        return ResponseEntity.ok(expenses);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateExpense(@PathVariable Long id, @RequestBody ExpenseRequest request) {
        UserDetailsImpl userDetails = getCurrentUser();
        ExpenseResponse response = expenseService.updateExpense(id, request, userDetails.getId());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteExpense(@PathVariable Long id) {
        UserDetailsImpl userDetails = getCurrentUser();
        expenseService.deleteExpense(id, userDetails.getId());
        return ResponseEntity.ok(new MessageResponse("Expense deleted successfully!"));
    }

    @GetMapping("/trip/{tripId}/total")
    public ResponseEntity<?> getTotalExpenses(@PathVariable Long tripId) {
        Double total = expenseService.getTotalExpenses(tripId);
        return ResponseEntity.ok(total);
    }

    private UserDetailsImpl getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (UserDetailsImpl) authentication.getPrincipal();
    }
}