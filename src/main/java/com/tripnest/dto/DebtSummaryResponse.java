package com.tripnest.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DebtSummaryResponse {
    private Long tripId;
    private String tripTitle;
    private BigDecimal totalExpenses = BigDecimal.ZERO;
    private List<UserBalanceResponse> userBalances = new ArrayList<>();
    private List<DebtItemResponse> debts = new ArrayList<>();
    private List<SettlementHistoryResponse> settledHistory = new ArrayList<>();
}
