package com.tripnest.repository;

import com.tripnest.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {
    Optional<Budget> findByTripId(Long tripId);

    @Query("SELECT COALESCE(SUM(b.totalAmount), 0.0) FROM Budget b")
    Double getTotalSystemBudget();
}