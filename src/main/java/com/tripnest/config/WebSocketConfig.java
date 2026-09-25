package com.tripnest.config;

import com.tripnest.security.websocket.WebSocketAuthChannelInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.Arrays;

/**
 * WebSocket and STOMP message broker configuration for real-time group collaboration.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Autowired
    private WebSocketAuthChannelInterceptor webSocketAuthChannelInterceptor;

    @Value("${tripnest.cors.allowed-origins:http://localhost:5173,http://localhost:5174}")
    private String allowedOrigins;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        java.util.Set<String> originSet = new java.util.LinkedHashSet<>();
        if (allowedOrigins != null && !allowedOrigins.trim().isEmpty()) {
            Arrays.stream(allowedOrigins.split(","))
                    .map(String::trim)
                    .map(s -> s.replaceAll("/+$", ""))
                    .filter(s -> !s.isEmpty())
                    .forEach(originSet::add);
        }

        boolean hasLocalOrigin = originSet.isEmpty() || originSet.stream().anyMatch(o -> o.contains("localhost") || o.contains("127.0.0.1"));
        if (hasLocalOrigin) {
            originSet.add("http://localhost:5173");
            originSet.add("http://localhost:5174");
            originSet.add("http://localhost:3000");
            originSet.add("http://127.0.0.1:5173");
            originSet.add("http://127.0.0.1:5174");
            originSet.add("http://127.0.0.1:3000");
            originSet.add("http://localhost");
            originSet.add("http://127.0.0.1");
        }

        String[] origins = originSet.toArray(new String[0]);

        // Native WebSocket STOMP endpoint
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(origins);

        // SockJS fallback STOMP endpoint
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(origins)
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // In-memory message broker for subscription topics
        registry.enableSimpleBroker("/topic");

        // Prefix for application-bound messages handled by @MessageMapping
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(webSocketAuthChannelInterceptor);
    }
}
