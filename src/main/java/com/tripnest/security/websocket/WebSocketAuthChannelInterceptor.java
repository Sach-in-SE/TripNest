package com.tripnest.security.websocket;

import com.tripnest.security.JwtUtils;
import com.tripnest.security.UserDetailsImpl;
import com.tripnest.security.UserDetailsServiceImpl;
import com.tripnest.service.GroupService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Inbound STOMP ChannelInterceptor enforcing strict JWT authentication on CONNECT
 * and group membership authorization on SUBSCRIBE and SEND.
 */
@Component
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketAuthChannelInterceptor.class);
    private static final Pattern GROUP_TOPIC_PATTERN = Pattern.compile("^/topic/groups/(\\d+)$");
    private static final Pattern GROUP_SEND_PATTERN = Pattern.compile("^/app/groups/(\\d+)/send$");

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Autowired
    private GroupService groupService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || !accessor.isMutable()) {
            accessor = StompHeaderAccessor.wrap(message);
        }

        StompCommand command = accessor.getCommand();
        if (command == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(command)) {
            handleConnect(accessor);
        } else if (StompCommand.SUBSCRIBE.equals(command)) {
            handleSubscribe(accessor);
        } else if (StompCommand.SEND.equals(command)) {
            handleSend(accessor);
        }

        return org.springframework.messaging.support.MessageBuilder.createMessage(message.getPayload(), accessor.getMessageHeaders());
    }

    private void handleConnect(StompHeaderAccessor accessor) {
        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            logger.warn("WebSocket STOMP CONNECT rejected: missing or invalid Authorization header");
            throw new MessageDeliveryException("Missing or invalid Authorization header in STOMP CONNECT");
        }

        String jwt = authHeader.substring(7).trim();
        if (jwt.isEmpty() || !jwtUtils.validateJwtToken(jwt)) {
            logger.warn("WebSocket STOMP CONNECT rejected: invalid or expired JWT token");
            throw new MessageDeliveryException("Invalid or expired JWT token in STOMP CONNECT");
        }

        String username = jwtUtils.getUserNameFromJwtToken(jwt);
        if (username == null || username.isBlank()) {
            logger.warn("WebSocket STOMP CONNECT rejected: cannot extract username from JWT");
            throw new MessageDeliveryException("Cannot extract user identity from JWT token");
        }

        try {
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            if (!userDetails.isEnabled()) {
                logger.warn("WebSocket STOMP CONNECT rejected: user account is disabled for {}", username);
                throw new MessageDeliveryException("User account is disabled");
            }

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
            accessor.setUser(authentication);
            logger.debug("WebSocket STOMP CONNECT authenticated successfully for user: {}", username);
        } catch (Exception e) {
            logger.warn("WebSocket STOMP CONNECT rejected: failed to load user details for {}: {}", username, e.getMessage());
            throw new MessageDeliveryException("Authentication failed: " + e.getMessage());
        }
    }

    private void handleSubscribe(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        if (destination == null || destination.isBlank()) {
            throw new MessageDeliveryException("Destination is required for SUBSCRIBE");
        }

        Matcher matcher = GROUP_TOPIC_PATTERN.matcher(destination);
        if (matcher.matches()) {
            Long groupId = Long.parseLong(matcher.group(1));
            UserDetailsImpl userDetails = getAuthenticatedUserDetails(accessor);

            try {
                // Reuse exact group authorization logic
                groupService.getAccessibleGroup(groupId, userDetails.getId());
                logger.debug("WebSocket STOMP SUBSCRIBE authorized for user {} on group {}", userDetails.getUsername(), groupId);
            } catch (AccessDeniedException e) {
                logger.warn("WebSocket STOMP SUBSCRIBE forbidden for user {} on group {}: {}", userDetails.getUsername(), groupId, e.getMessage());
                throw new MessageDeliveryException("Access denied: You are not authorized to subscribe to this group discussion");
            } catch (Exception e) {
                logger.warn("WebSocket STOMP SUBSCRIBE rejected for user {} on group {}: {}", userDetails.getUsername(), groupId, e.getMessage());
                throw new MessageDeliveryException("Cannot subscribe to group discussion: " + e.getMessage());
            }
        }
    }

    private void handleSend(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        if (destination == null || destination.isBlank()) {
            return;
        }

        Matcher matcher = GROUP_SEND_PATTERN.matcher(destination);
        if (matcher.matches()) {
            Long groupId = Long.parseLong(matcher.group(1));
            UserDetailsImpl userDetails = getAuthenticatedUserDetails(accessor);

            try {
                groupService.getAccessibleGroup(groupId, userDetails.getId());
            } catch (AccessDeniedException e) {
                logger.warn("WebSocket STOMP SEND forbidden for user {} on group {}: {}", userDetails.getUsername(), groupId, e.getMessage());
                throw new MessageDeliveryException("Access denied: You are not authorized to send messages to this group");
            } catch (Exception e) {
                logger.warn("WebSocket STOMP SEND rejected for user {} on group {}: {}", userDetails.getUsername(), groupId, e.getMessage());
                throw new MessageDeliveryException("Cannot send message to group: " + e.getMessage());
            }
        }
    }

    private UserDetailsImpl getAuthenticatedUserDetails(StompHeaderAccessor accessor) {
        Principal principal = accessor.getUser();
        if (principal == null) {
            throw new MessageDeliveryException("Unauthenticated STOMP session. Please connect with valid credentials.");
        }

        if (principal instanceof Authentication auth && auth.getPrincipal() instanceof UserDetailsImpl userDetails) {
            return userDetails;
        }

        throw new MessageDeliveryException("Invalid authentication principal in STOMP session.");
    }
}
