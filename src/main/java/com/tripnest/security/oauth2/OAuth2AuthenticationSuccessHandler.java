package com.tripnest.security.oauth2;

import com.tripnest.entity.User;
import com.tripnest.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Autowired
    private OAuth2ExchangeCodeService oAuth2ExchangeCodeService;

    @Autowired
    private UserRepository userRepository;

    @Value("${app.frontend.url:${FRONTEND_URL:http://localhost}}")
    private String frontendUrl;

    @Value("${app.oauth2.authorized-redirect-uris:${app.oauth2.authorizedRedirectUris:}}")
    private String authorizedRedirectUris;

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

        // Redirect to frontend with exchange code in URL parameter, honoring FRONTEND_URL and authorizedRedirectUris
        String targetUrl = resolveTargetUrl(request, exchangeCode);
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    /**
     * Resolves the target redirect URI honoring app.oauth2.authorizedRedirectUris,
     * configured FRONTEND_URL / app.frontend.url, or a valid requested redirect_uri parameter.
     */
    public String resolveTargetUrl(HttpServletRequest request, String exchangeCode) {
        String requestedRedirectUri = (request != null) ? request.getParameter("redirect_uri") : null;
        List<String> authorizedUris = parseAuthorizedRedirectUris();

        String selectedUri = null;

        // 1. If a redirect_uri parameter was requested, validate against authorizedRedirectUris
        if (requestedRedirectUri != null && !requestedRedirectUri.isBlank()) {
            String trimmedUri = requestedRedirectUri.trim();
            if (isAuthorizedUri(trimmedUri, authorizedUris)) {
                selectedUri = trimmedUri;
            }
        }

        // 2. If no valid requested redirect_uri, select from authorizedRedirectUris or frontendUrl
        if (selectedUri == null) {
            if (!authorizedUris.isEmpty()) {
                selectedUri = authorizedUris.get(0);
            } else if (frontendUrl != null && !frontendUrl.isBlank()) {
                selectedUri = frontendUrl.trim();
            } else {
                selectedUri = "http://localhost";
            }
        }

        // 3. Normalize: ensure target points to /oauth2/redirect
        String normalizedUri = selectedUri.replaceAll("/+$", "");
        if (!normalizedUri.contains("/oauth2/redirect")) {
            normalizedUri = normalizedUri + "/oauth2/redirect";
        }

        char separator = normalizedUri.contains("?") ? '&' : '?';
        return normalizedUri + separator + "code=" + exchangeCode;
    }

    private List<String> parseAuthorizedRedirectUris() {
        if (authorizedRedirectUris == null || authorizedRedirectUris.isBlank()) {
            return Collections.emptyList();
        }
        return Arrays.stream(authorizedRedirectUris.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    private boolean isAuthorizedUri(String uri, List<String> authorizedUris) {
        if (uri == null || uri.isBlank()) {
            return false;
        }

        if (authorizedUris == null || authorizedUris.isEmpty()) {
            // Fallback to checking against frontendUrl if no explicit authorized list
            String base = (frontendUrl != null && !frontendUrl.isBlank())
                    ? frontendUrl.trim().replaceAll("/+$", "")
                    : "http://localhost";
            return uri.startsWith(base);
        }

        try {
            URI clientUri = URI.create(uri);
            for (String authUriStr : authorizedUris) {
                URI authUri = URI.create(authUriStr);
                boolean hostMatch = authUri.getHost() != null && authUri.getHost().equalsIgnoreCase(clientUri.getHost());
                boolean portMatch = authUri.getPort() == clientUri.getPort();
                boolean schemeMatch = authUri.getScheme() == null || authUri.getScheme().equalsIgnoreCase(clientUri.getScheme());

                if (hostMatch && portMatch && schemeMatch) {
                    return true;
                }
            }
        } catch (Exception e) {
            return false;
        }
        return false;
    }
}