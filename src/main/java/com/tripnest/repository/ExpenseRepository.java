package com.tripnest.repository;

import com.tripnest.entity.Expense;
import com.tripnest.entity.ExpenseCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByTripId(Long tripId);

    @Query("SELECT e FROM Expense e JOIN FETCH e.user JOIN FETCH e.trip WHERE e.trip.id = :tripId ORDER BY e.date DESC, e.createdAt DESC")
    List<Expense> findByTripIdWithUserAndTrip(@org.springframework.data.repository.query.Param("tripId") Long tripId);

    List<Expense> findByTripIdAndCategory(Long tripId, ExpenseCategory category);
    List<Expense> findByUserId(Long userId);

    @Query("SELECT SUM(e.amount) FROM Expense e WHERE e.trip.id = ?1")
    Double getTotalExpenseByTripId(Long tripId);

    @Query("SELECT e.trip.id, COALESCE(SUM(e.amount), 0.0) FROM Expense e WHERE e.trip.id IN :tripIds GROUP BY e.trip.id")
    List<Object[]> findTotalExpensesByTripIds(@org.springframework.data.repository.query.Param("tripIds") List<Long> tripIds);

    @Query("SELECT DISTINCT e FROM Expense e " +
           "JOIN FETCH e.user u " +
           "JOIN FETCH e.trip t " +
           "LEFT JOIN TripShare ts ON ts.trip = t AND ts.sharedWithUser.id = :userId AND ts.status = com.tripnest.entity.ShareStatus.ACCEPTED " +
           "WHERE t.user.id = :userId OR e.user.id = :userId OR ts.id IS NOT NULL " +
           "ORDER BY e.date DESC, e.createdAt DESC")
    List<Expense> findAccessibleExpensesByUserId(@org.springframework.data.repository.query.Param("userId") Long userId);

    @Query("SELECT COALESCE(SUM(e.amount), 0.0) FROM Expense e")
    Double getTotalSystemExpenses();

    @Modifying
    @Query("DELETE FROM Expense e WHERE e.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM Expense e WHERE e.trip.id = :tripId")
    void deleteByTripId(@Param("tripId") Long tripId);
}