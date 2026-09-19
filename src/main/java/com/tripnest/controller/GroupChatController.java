package com.tripnest.controller;

import com.tripnest.dto.GroupMessageRequest;
import com.tripnest.dto.GroupMessageResponse;
import com.tripnest.security.UserDetailsImpl;
import com.tripnest.service.GroupService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import java.security.Principal;

/**
 * Controller handling real-time STOMP message sending for group discussions.
 */
@Controller
public class GroupChatController {

    private static final Logger logger = LoggerFactory.getLogger(GroupChatController.class);

    @Autowired
    private GroupService groupService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Handles STOMP message send to /app/groups/{groupId}/send.
     * Enforces authentication, group authorization, message validation,
     * database persistence, and then broadcasts to /topic/groups/{groupId}.
     */
    @MessageMapping("/groups/{groupId}/send")
    public void sendGroupMessage(
            @DestinationVariable Long groupId,
            @Payload @Valid GroupMessageRequest request,
            Principal principal) {

        if (principal == null) {
            logger.warn("STOMP message rejected: unauthenticated principal for group {}", groupId);
            throw new IllegalArgumentException("Unauthenticated user cannot send messages");
        }

        UserDetailsImpl userDetails = extractUserDetails(principal);

        // 1. Persist to database (enforces content validation, length constraints, and group membership)
        GroupMessageResponse response = groupService.sendGroupMessage(groupId, request, userDetails.getId());
        if (response == null) {
            logger.warn("GroupService returned null response for group {}", groupId);
            return;
        }
        logger.debug("STOMP message persisted successfully (id: {}) for group {}", response.getId(), groupId);

        // 2. Broadcast ONLY after database save succeeds
        String destination = "/topic/groups/" + groupId;
        messagingTemplate.convertAndSend(destination, response);
        logger.debug("STOMP message broadcast to destination {}", destination);
    }

    private UserDetailsImpl extractUserDetails(Principal principal) {
        if (principal instanceof Authentication auth && auth.getPrincipal() instanceof UserDetailsImpl ud) {
            return ud;
        }
        throw new IllegalArgumentException("Invalid authentication principal in STOMP message");
    }
}
