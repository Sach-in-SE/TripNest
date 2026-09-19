package com.tripnest.repository;

import com.tripnest.model.Settlement;
import com.tripnest.model.SettlementStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SettlementRepository extends JpaRepository<Settlement, Long> {

    List<Settlement> findByTripId(Long tripId);

    @Query("SELECT s FROM Settlement s JOIN FETCH s.trip t JOIN FETCH s.payer p JOIN FETCH s.payee pa WHERE t.id = :tripId ORDER BY s.createdAt DESC")
    List<Settlement> findByTripIdWithPayerAndPayee(@Param("tripId") Long tripId);

    List<Settlement> findByTripIdAndStatus(Long tripId, SettlementStatus status);

    Optional<Settlement> findByTripIdAndPayerIdAndPayeeIdAndStatus(Long tripId, Long payerId, Long payeeId, SettlementStatus status);

    List<Settlement> findByPayerId(Long payerId);

    List<Settlement> findByPayeeId(Long payeeId);

    @Modifying
    @Query("DELETE FROM Settlement s WHERE s.trip.id = :tripId")
    void deleteByTripId(@Param("tripId") Long tripId);

    @Modifying
    @Query("DELETE FROM Settlement s WHERE s.payer.id = :userId OR s.payee.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);
}
