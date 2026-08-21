package com.tripnest.controller;

import com.tripnest.dto.ContactMessageRequest;
import com.tripnest.dto.ContactMessageResponse;
import com.tripnest.dto.ContactStatusUpdateRequest;
import com.tripnest.dto.MessageResponse;
import com.tripnest.entity.ContactMessageStatus;
import com.tripnest.security.UserDetailsImpl;
import com.tripnest.service.ContactMessageService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
public class ContactMessageController {

    @Autowired
    private ContactMessageService contactMessageService;

    // Public Contact Submission Endpoint
    @PostMapping("/api/contact")
    public ResponseEntity<ContactMessageResponse> submitContactMessage(
            @Valid @RequestBody ContactMessageRequest request) {
        Long currentUserId = getCurrentUserId();
        ContactMessageResponse response = contactMessageService.submitMessage(request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // Admin: List Contact Messages with Status & Search Filters
    @GetMapping("/api/admin/contact-messages")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ContactMessageResponse>> getContactMessages(
            @RequestParam(value = "status", required = false) ContactMessageStatus status,
            @RequestParam(value = "search", required = false) String search) {
        List<ContactMessageResponse> messages = contactMessageService.getMessages(status, search);
        return ResponseEntity.ok(messages);
    }

    // Admin: Get Inbox Statistics
    @GetMapping("/api/admin/contact-messages/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getInboxStats() {
        Map<String, Object> stats = contactMessageService.getInboxStats();
        return ResponseEntity.ok(stats);
    }

    // Admin: Get Specific Contact Message by ID
    @GetMapping("/api/admin/contact-messages/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ContactMessageResponse> getContactMessageById(@PathVariable Long id) {
        ContactMessageResponse message = contactMessageService.getMessageById(id);
        return ResponseEntity.ok(message);
    }

    // Admin: Update Message Status
    @PutMapping("/api/admin/contact-messages/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ContactMessageResponse> updateContactMessageStatus(
            @PathVariable Long id,
            @Valid @RequestBody ContactStatusUpdateRequest request) {
        ContactMessageResponse response = contactMessageService.updateMessageStatus(id, request.getStatus());
        return ResponseEntity.ok(response);
    }

    // Admin: Delete Message
    @DeleteMapping("/api/admin/contact-messages/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MessageResponse> deleteContactMessage(@PathVariable Long id) {
        contactMessageService.deleteMessage(id);
        return ResponseEntity.ok(new MessageResponse("Contact message deleted successfully"));
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
            return ((UserDetailsImpl) authentication.getPrincipal()).getId();
        }
        return null;
    }
}
