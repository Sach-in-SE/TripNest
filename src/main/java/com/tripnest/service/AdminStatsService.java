package com.tripnest.service;

import com.tripnest.dto.AdminStatsResponse;
import com.tripnest.entity.TripStatus;
import com.tripnest.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminStatsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private DestinationRepository destinationRepository;

    @Autowired
    private BudgetRepository budgetRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Transactional(readOnly = true)
    public AdminStatsResponse getAdminStats() {
        AdminStatsResponse stats = new AdminStatsResponse();

        // User Metrics
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByEnabled(true);
        long disabledUsers = userRepository.countByEnabled(false);

        stats.setTotalUsers(totalUsers);
        stats.setActiveUsers(activeUsers);
        stats.setDisabledUsers(disabledUsers);

        // Trip Metrics
        long totalTrips = tripRepository.count();
        long planningTrips = tripRepository.countByStatus(TripStatus.PLANNING);
        long upcomingTrips = tripRepository.countByStatus(TripStatus.UPCOMING);
        long ongoingTrips = tripRepository.countByStatus(TripStatus.ONGOING);
        long completedTrips = tripRepository.countByStatus(TripStatus.COMPLETED);
        long cancelledTrips = tripRepository.countByStatus(TripStatus.CANCELLED);
        long activeTrips = planningTrips + upcomingTrips + ongoingTrips;

        stats.setTotalTrips(totalTrips);
        stats.setPlanningTrips(planningTrips);
        stats.setUpcomingTrips(upcomingTrips);
        stats.setOngoingTrips(ongoingTrips);
        stats.setCompletedTrips(completedTrips);
        stats.setCancelledTrips(cancelledTrips);
        stats.setActiveTrips(activeTrips);

        // Destination Metrics
        long totalDestinations = destinationRepository.count();
        stats.setTotalDestinations(totalDestinations);

        // Financial Metrics
        Double totalBudget = budgetRepository.getTotalSystemBudget();
        Double totalExpenses = expenseRepository.getTotalSystemExpenses();
        long totalExpensesCount = expenseRepository.count();

        stats.setTotalBudgetedAmount(totalBudget != null ? totalBudget : 0.0);
        stats.setTotalExpensesAmount(totalExpenses != null ? totalExpenses : 0.0);
        stats.setTotalExpensesCount(totalExpensesCount);

        return stats;
    }
}
