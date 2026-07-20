package com.tripnest.service;

import com.tripnest.dto.BudgetRequest;
import com.tripnest.dto.BudgetResponse;
import com.tripnest.entity.Budget;
import com.tripnest.entity.Trip;
import com.tripnest.repository.BudgetRepository;
import com.tripnest.repository.ExpenseRepository;
import com.tripnest.repository.TripRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class BudgetService {

    @Autowired
    private BudgetRepository budgetRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private TripShareService tripShareService;

    public BudgetResponse createOrUpdateBudget(BudgetRequest request, Long userId) {
        Trip trip = tripRepository.findById(request.getTripId())
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        boolean isOwner = trip.getUser().getId().equals(userId);
        boolean hasEditAccess = tripShareService.hasEditAccess(request.getTripId(), userId);
        if (!isOwner && !hasEditAccess) {
            throw new RuntimeException("Unauthorized");
        }

        Budget budget = budgetRepository.findByTripId(request.getTripId())
                .orElse(new Budget());

        budget.setTotalAmount(request.getTotalAmount());
        budget.setCurrency(request.getCurrency() != null ? request.getCurrency() : "INR");
        budget.setTrip(trip);

        Double spent = expenseRepository.getTotalExpenseByTripId(request.getTripId());
        budget.setSpentAmount(spent != null ? spent : 0.0);
        budget.setRemainingAmount(budget.getTotalAmount() - budget.getSpentAmount());

        Budget saved = budgetRepository.save(budget);
        return mapToResponse(saved);
    }

    public BudgetResponse getBudgetByTripId(Long tripId, Long userId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        boolean isOwner = trip.getUser().getId().equals(userId);
        boolean hasAccess = tripShareService.hasAccess(tripId, userId);
        if (!isOwner && !hasAccess) {
            throw new RuntimeException("Unauthorized");
        }

        Budget budget = budgetRepository.findByTripId(tripId)
                .orElseThrow(() -> new RuntimeException("Budget not found"));

        Double spent = expenseRepository.getTotalExpenseByTripId(tripId);
        budget.setSpentAmount(spent != null ? spent : 0.0);
        budget.setRemainingAmount(budget.getTotalAmount() - budget.getSpentAmount());
        budgetRepository.save(budget);

        return mapToResponse(budget);
    }

    private BudgetResponse mapToResponse(Budget budget) {
        BudgetResponse response = new BudgetResponse();
        response.setId(budget.getId());
        response.setTotalAmount(budget.getTotalAmount());
        response.setSpentAmount(budget.getSpentAmount());
        response.setRemainingAmount(budget.getRemainingAmount());
        response.setCurrency(budget.getCurrency());
        response.setTripId(budget.getTrip().getId());
        response.setTripTitle(budget.getTrip().getTitle());
        response.setCreatedAt(budget.getCreatedAt());
        response.setUpdatedAt(budget.getUpdatedAt());

        if (budget.getTotalAmount() != null && budget.getTotalAmount() > 0) {
            double percentage = (budget.getSpentAmount() / budget.getTotalAmount()) * 100;
            response.setPercentageUsed(Math.round(percentage * 100.0) / 100.0);
        } else {
            response.setPercentageUsed(0.0);
        }

        return response;
    }
}