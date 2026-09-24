package com.tripnest.repository;

import com.tripnest.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByUsernameIgnoreCase(String username);
    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.roles WHERE LOWER(u.username) = LOWER(:username)")
    Optional<User> findByUsernameWithRoles(@Param("username") String username);
    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.roles WHERE LOWER(u.username) = LOWER(:identifier) OR LOWER(u.email) = LOWER(:identifier)")
    Optional<User> findByUsernameOrEmailWithRoles(@Param("identifier") String identifier);
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailIgnoreCase(String email);
    Boolean existsByUsername(String username);
    Boolean existsByEmail(String email);
    long countByEnabled(boolean enabled);

    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.roles WHERE u.id = :id")
    Optional<User> findByIdWithRoles(@Param("id") Long id);

    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.roles r WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:enabled IS NULL OR u.enabled = :enabled) AND " +
           "(:role IS NULL OR r.name = :role)")
    List<User> searchUsers(@Param("search") String search,
                           @Param("enabled") Boolean enabled,
                           @Param("role") com.tripnest.entity.ERole role);

    @Query(value = "SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.roles r WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:enabled IS NULL OR u.enabled = :enabled) AND " +
           "(:role IS NULL OR r.name = :role)",
           countQuery = "SELECT count(DISTINCT u) FROM User u LEFT JOIN u.roles r WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:enabled IS NULL OR u.enabled = :enabled) AND " +
           "(:role IS NULL OR r.name = :role)")
    Page<User> searchUsers(@Param("search") String search,
                           @Param("enabled") Boolean enabled,
                           @Param("role") com.tripnest.entity.ERole role,
                           Pageable pageable);
}