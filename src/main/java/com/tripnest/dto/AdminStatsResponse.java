package com.tripnest.dto;

import lombok.Data;

@Data
public class AdminStatsResponse {

    // User Metrics
    private long totalUsers;
    private long activeUsers;
    private long disabledUsers;

    // Trip Metrics
    private long totalTrips;
    private long activeTrips; // Sum of ONGOING + UPCOMING + PLANNING
    private long planningTrips;
    private long upcomingTrips;
    private long ongoingTrips;
    private long completedTrips;
    private long cancelledTrips;

    // Destination Metrics
    private long totalDestinations;

    // Financial Metrics
    private double totalBudgetedAmount;
    private double totalExpensesAmount;
    private long totalExpensesCount;
}
