package com.tripnest.service;

import com.tripnest.dto.ExpenseRequest;
import com.tripnest.dto.ExpenseResponse;
import com.tripnest.entity.Expense;
import com.tripnest.entity.ExpenseCategory;
import com.tripnest.entity.Trip;
import com.tripnest.entity.User;
import com.tripnest.repository.ExpenseRepository;
import com.tripnest.repository.TripRepository;
import com.tripnest.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ExpenseService {

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TripShareService tripShareService;

    public ExpenseResponse createExpense(ExpenseRequest request, Long userId) {
        Trip trip = tripRepository.findById(request.getTripId())
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        boolean isOwner = trip.getUser().getId().equals(userId);
        boolean hasEditAccess = tripShareService.hasEditAccess(request.getTripId(), userId);
        if (!isOwner && !hasEditAccess) {
            throw new RuntimeException("Unauthorized");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Expense expense = new Expense();
        expense.setTitle(request.getTitle());
        expense.setAmount(request.getAmount());
        expense.setDescription(request.getDescription());
        expense.setDate(request.getDate());
        expense.setTrip(trip);
        expense.setUser(user);

        if (request.getCategory() != null) {
            expense.setCategory(ExpenseCategory.valueOf(request.getCategory()));
        }

        Expense saved = expenseRepository.save(expense);
        return mapToResponse(saved);
    }

    public List<ExpenseResponse> getTripExpenses(Long tripId, Long userId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        boolean isOwner = trip.getUser().getId().equals(userId);
        boolean hasAccess = tripShareService.hasAccess(tripId, userId);
        if (!isOwner && !hasAccess) {
            throw new RuntimeException("Unauthorized");
        }

        return expenseRepository.findByTripId(tripId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ExpenseResponse updateExpense(Long id, ExpenseRequest request, Long userId) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found"));

        Trip trip = expense.getTrip();
        boolean isOwner = trip.getUser().getId().equals(userId);
        boolean hasEditAccess = tripShareService.hasEditAccess(trip.getId(), userId);
        if (!isOwner && !hasEditAccess) {
            throw new RuntimeException("Unauthorized");
        }

        expense.setTitle(request.getTitle());
        expense.setAmount(request.getAmount());
        expense.setDescription(request.getDescription());
        expense.setDate(request.getDate());

        if (request.getCategory() != null) {
            expense.setCategory(ExpenseCategory.valueOf(request.getCategory()));
        }

        Expense updated = expenseRepository.save(expense);
        return mapToResponse(updated);
    }

    public void deleteExpense(Long id, Long userId) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found"));

        Trip trip = expense.getTrip();
        boolean isOwner = trip.getUser().getId().equals(userId);
        boolean hasEditAccess = tripShareService.hasEditAccess(trip.getId(), userId);
        if (!isOwner && !hasEditAccess) {
            throw new RuntimeException("Unauthorized");
        }

        expenseRepository.delete(expense);
    }

    public Double getTotalExpenses(Long tripId) {
        Double total = expenseRepository.getTotalExpenseByTripId(tripId);
        return total != null ? total : 0.0;
    }

    private ExpenseResponse mapToResponse(Expense expense) {
        ExpenseResponse response = new ExpenseResponse();
        response.setId(expense.getId());
        response.setTitle(expense.getTitle());
        response.setAmount(expense.getAmount());
        response.setCategory(expense.getCategory() != null ? expense.getCategory().name() : null);
        response.setDescription(expense.getDescription());
        response.setDate(expense.getDate());
        response.setTripId(expense.getTrip().getId());
        response.setTripTitle(expense.getTrip().getTitle());
        response.setUserId(expense.getUser().getId());
        response.setUsername(expense.getUser().getUsername());
        response.setCreatedAt(expense.getCreatedAt());
        response.setUpdatedAt(expense.getUpdatedAt());
        return response;
    }
}