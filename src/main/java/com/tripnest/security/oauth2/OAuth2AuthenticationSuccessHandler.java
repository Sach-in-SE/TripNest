package com.tripnest.security.oauth2;

import com.tripnest.entity.User;
import com.tripnest.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Autowired
    private OAuth2ExchangeCodeService oAuth2ExchangeCodeService;

    @Autowired
    private UserRepository userRepository;

    @org.springframework.beans.factory.annotation.Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                         Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");

        // User should already be created/fetched in CustomOAuth2UserService
        // Fetch again to ensure we have the persisted user with correct ID
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new RuntimeException("User not found after OAuth login"));

        // Issue short-lived, single-use exchange code instead of exposing JWT in URL
        String exchangeCode = oAuth2ExchangeCodeService.createExchangeCode(user.getUsername());

        // Redirect to frontend with exchange code in URL parameter, normalizing trailing slashes
        String base = (frontendUrl != null && !frontendUrl.trim().isEmpty())
                ? frontendUrl.trim().replaceAll("/+$", "")
                : "http://localhost:5173";

        // In local development, if base is configured as localhost without an explicit port,
        // probe port 80; if no server is listening on port 80, fallback to Vite dev server on port 5173
        if ("http://localhost".equalsIgnoreCase(base) || "http://127.0.0.1".equalsIgnoreCase(base)) {
            try (java.net.Socket socket = new java.net.Socket()) {
                socket.connect(new java.net.InetSocketAddress("localhost", 80), 80);
            } catch (Exception e) {
                base = "http://localhost:5173";
            }
        }

        String targetUrl = base + "/oauth2/redirect?code=" + exchangeCode;
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}