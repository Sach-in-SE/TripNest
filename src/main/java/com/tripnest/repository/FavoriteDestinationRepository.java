package com.tripnest.repository;

import com.tripnest.entity.FavoriteDestination;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteDestinationRepository extends JpaRepository<FavoriteDestination, Long> {

    @Query("SELECT f FROM FavoriteDestination f JOIN FETCH f.destination WHERE f.user.id = :userId ORDER BY f.createdAt DESC")
    List<FavoriteDestination> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);

    Optional<FavoriteDestination> findByUserIdAndDestinationId(Long userId, Long destinationId);

    boolean existsByUserIdAndDestinationId(Long userId, Long destinationId);

    void deleteByUserIdAndDestinationId(Long userId, Long destinationId);

    @Modifying
    @Transactional
    @Query("DELETE FROM FavoriteDestination f WHERE f.destination.id = :destinationId")
    void deleteByDestinationId(@Param("destinationId") Long destinationId);

    @Modifying
    @Transactional
    @Query("DELETE FROM FavoriteDestination f WHERE f.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);
}

