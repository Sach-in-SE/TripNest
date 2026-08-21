package com.tripnest.repository;

import com.tripnest.entity.ContactCategory;
import com.tripnest.entity.ContactMessage;
import com.tripnest.entity.ContactMessageStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContactMessageRepository extends JpaRepository<ContactMessage, Long> {

    List<ContactMessage> findAllByOrderByCreatedAtDesc();

    List<ContactMessage> findByStatusOrderByCreatedAtDesc(ContactMessageStatus status);

    List<ContactMessage> findByCategoryOrderByCreatedAtDesc(ContactCategory category);

    @Query("SELECT c FROM ContactMessage c WHERE " +
           "(:status IS NULL OR c.status = :status) AND " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(c.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(c.subject) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(c.message) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY c.createdAt DESC")
    List<ContactMessage> searchMessages(
            @Param("status") ContactMessageStatus status,
            @Param("search") String search);

    long countByStatus(ContactMessageStatus status);
}
