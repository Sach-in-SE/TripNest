package com.tripnest.service;

import com.tripnest.dto.ContactMessageRequest;
import com.tripnest.dto.ContactMessageResponse;
import com.tripnest.entity.ContactMessage;
import com.tripnest.entity.ContactMessageStatus;
import com.tripnest.entity.User;
import com.tripnest.exception.ResourceNotFoundException;
import com.tripnest.repository.ContactMessageRepository;
import com.tripnest.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class ContactMessageService {

    private static final Logger logger = LoggerFactory.getLogger(ContactMessageService.class);

    @Autowired
    private ContactMessageRepository contactMessageRepository;

    @Autowired
    private UserRepository userRepository;

    public ContactMessageResponse submitMessage(ContactMessageRequest request, Long authenticatedUserId) {
        if (request == null) {
            throw new IllegalArgumentException("Contact message request cannot be null");
        }

        ContactMessage contactMessage = new ContactMessage();
        contactMessage.setName(request.getName() != null ? request.getName().trim() : "");
        contactMessage.setEmail(request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "");
        contactMessage.setCategory(request.getCategory());
        contactMessage.setSubject(request.getSubject() != null ? request.getSubject().trim() : "");
        contactMessage.setMessage(request.getMessage() != null ? request.getMessage().trim() : "");
        contactMessage.setStatus(ContactMessageStatus.NEW);

        if (authenticatedUserId != null) {
            User user = userRepository.findById(authenticatedUserId).orElse(null);
            if (user != null) {
                contactMessage.setUser(user);
            }
        }

        ContactMessage saved = contactMessageRepository.save(contactMessage);
        logger.info("Successfully persisted contact message #{} from {} ({})", saved.getId(), saved.getName(), saved.getEmail());

        return ContactMessageResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<ContactMessageResponse> getMessages(ContactMessageStatus status, String search) {
        String searchParam = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        List<ContactMessage> messages = contactMessageRepository.searchMessages(status, searchParam);
        return messages.stream()
                .map(ContactMessageResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ContactMessageResponse getMessageById(Long id) {
        ContactMessage message = contactMessageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contact message not found with ID: " + id));
        return ContactMessageResponse.fromEntity(message);
    }

    public ContactMessageResponse updateMessageStatus(Long id, ContactMessageStatus newStatus) {
        if (newStatus == null) {
            throw new IllegalArgumentException("New status cannot be null");
        }

        ContactMessage message = contactMessageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contact message not found with ID: " + id));

        message.setStatus(newStatus);
        ContactMessage updated = contactMessageRepository.save(message);
        logger.info("Updated contact message #{} status to {}", id, newStatus);
        return ContactMessageResponse.fromEntity(updated);
    }

    public void deleteMessage(Long id) {
        ContactMessage message = contactMessageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contact message not found with ID: " + id));
        contactMessageRepository.delete(message);
        logger.info("Deleted contact message #{}", id);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getInboxStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("total", contactMessageRepository.count());
        stats.put("newCount", contactMessageRepository.countByStatus(ContactMessageStatus.NEW));
        stats.put("readCount", contactMessageRepository.countByStatus(ContactMessageStatus.READ));
        stats.put("resolvedCount", contactMessageRepository.countByStatus(ContactMessageStatus.RESOLVED));
        stats.put("archivedCount", contactMessageRepository.countByStatus(ContactMessageStatus.ARCHIVED));
        return stats;
    }
}
