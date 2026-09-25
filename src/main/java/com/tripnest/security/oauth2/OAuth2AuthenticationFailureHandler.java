package com.tripnest.security.oauth2;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Custom OAuth2 failure handler that redirects safely to the frontend login page
 * without leaking sensitive internal error messages or credentials.
 */
@Component
public class OAuth2AuthenticationFailureHandler extends SimpleUrlAuthenticationFailureHandler {

    private static final Logger logger = LoggerFactory.getLogger(OAuth2AuthenticationFailureHandler.class);

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
                                        AuthenticationException exception) throws IOException, ServletException {
        logger.warn("OAuth2 authentication failure: {}", exception != null ? exception.getMessage() : "unspecified error");

        String base = (frontendUrl != null && !frontendUrl.trim().isEmpty())
                ? frontendUrl.trim().replaceAll("/+$", "")
                : "http://localhost:5173";

        if ("http://localhost".equalsIgnoreCase(base) || "http://127.0.0.1".equalsIgnoreCase(base)) {
            try (java.net.Socket socket = new java.net.Socket()) {
                socket.connect(new java.net.InetSocketAddress("localhost", 80), 80);
            } catch (Exception e) {
                base = "http://localhost:5173";
            }
        }

        String targetUrl = base + "/login?oauth_error=true";
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
