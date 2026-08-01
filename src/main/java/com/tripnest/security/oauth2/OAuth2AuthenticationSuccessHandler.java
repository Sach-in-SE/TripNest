package com.tripnest.security.oauth2;

import com.tripnest.entity.User;
import com.tripnest.repository.UserRepository;
import com.tripnest.security.JwtUtils;
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
    private JwtUtils jwtUtils;

    @Autowired
    private UserRepository userRepository;

    private static final String FRONTEND_REDIRECT_URL = "http://localhost:5173/oauth2/redirect";

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                         Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found after OAuth login"));

        // Username-based subject use kiya hai, taaki baaki system (AuthTokenFilter, UserDetailsServiceImpl) se match ho
        String token = jwtUtils.generateJwtToken(user.getUsername());

        String targetUrl = FRONTEND_REDIRECT_URL + "?token=" + token;
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}