package com.tripnest.repository;

import com.tripnest.model.ExpenseSplit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExpenseSplitRepository extends JpaRepository<ExpenseSplit, Long> {

    List<ExpenseSplit> findByExpenseId(Long expenseId);

    @Query("SELECT s FROM ExpenseSplit s JOIN FETCH s.user WHERE s.expense.id = :expenseId")
    List<ExpenseSplit> findByExpenseIdWithUser(@Param("expenseId") Long expenseId);

    List<ExpenseSplit> findByUserId(Long userId);

    @Query("SELECT s FROM ExpenseSplit s JOIN FETCH s.expense e JOIN FETCH s.user u WHERE e.trip.id = :tripId")
    List<ExpenseSplit> findByTripIdWithExpenseAndUser(@Param("tripId") Long tripId);

    @Modifying
    @Query("DELETE FROM ExpenseSplit s WHERE s.expense.id = :expenseId")
    void deleteByExpenseId(@Param("expenseId") Long expenseId);

    @Modifying
    @Query("DELETE FROM ExpenseSplit s WHERE s.expense.trip.id = :tripId")
    void deleteByTripId(@Param("tripId") Long tripId);

    @Modifying
    @Query("DELETE FROM ExpenseSplit s WHERE s.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);
}
