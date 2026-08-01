package com.tripnest.repository;

import com.tripnest.entity.Expense;
import com.tripnest.entity.ExpenseCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByTripId(Long tripId);
    List<Expense> findByTripIdAndCategory(Long tripId, ExpenseCategory category);
    List<Expense> findByUserId(Long userId);

    @Query("SELECT SUM(e.amount) FROM Expense e WHERE e.trip.id = ?1")
    Double getTotalExpenseByTripId(Long tripId);
}