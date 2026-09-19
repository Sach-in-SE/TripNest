package com.tripnest.controller;

import com.tripnest.dto.DebtSummaryResponse;
import com.tripnest.dto.ExpenseSplitResponse;
import com.tripnest.dto.SettlementHistoryResponse;
import com.tripnest.dto.TripMemberResponse;
import com.tripnest.security.UserDetailsImpl;
import com.tripnest.service.ExpenseSplitService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ExpenseSplitController {

    @Autowired
    private ExpenseSplitService expenseSplitService;

    @GetMapping("/trips/{tripId}/balances")
    public ResponseEntity<DebtSummaryResponse> getGroupBalances(@PathVariable Long tripId) {
        UserDetailsImpl currentUser = getCurrentUser();
        DebtSummaryResponse response = expenseSplitService.getGroupBalances(tripId, currentUser.getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/settlements/{settlementId}/settle")
    public ResponseEntity<SettlementHistoryResponse> settleDebt(@PathVariable Long settlementId) {
        UserDetailsImpl currentUser = getCurrentUser();
        SettlementHistoryResponse response = expenseSplitService.settleDebt(settlementId, currentUser.getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/trips/{tripId}/members")
    public ResponseEntity<List<TripMemberResponse>> getTripMembers(@PathVariable Long tripId) {
        UserDetailsImpl currentUser = getCurrentUser();
        List<TripMemberResponse> members = expenseSplitService.getTripMembers(tripId, currentUser.getId());
        return ResponseEntity.ok(members);
    }

    @GetMapping("/expenses/{expenseId}/splits")
    public ResponseEntity<List<ExpenseSplitResponse>> getExpenseSplits(@PathVariable Long expenseId) {
        List<ExpenseSplitResponse> splits = expenseSplitService.getSplitsByExpenseId(expenseId);
        return ResponseEntity.ok(splits);
    }

    private UserDetailsImpl getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (UserDetailsImpl) authentication.getPrincipal();
    }
}
