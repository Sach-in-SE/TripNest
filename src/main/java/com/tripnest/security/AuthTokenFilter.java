package com.tripnest.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

public class AuthTokenFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    private static final Logger logger = LoggerFactory.getLogger(AuthTokenFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String requestUri = request.getRequestURI();
            String requestMethod = request.getMethod();
            logger.info("DEBUG AuthTokenFilter: Request {} {}", requestMethod, requestUri);
            
            String headerAuth = request.getHeader("Authorization");
            logger.info("DEBUG AuthTokenFilter: Authorization header present={} value={}", headerAuth != null, headerAuth);
            
            String jwt = parseJwt(request);
            logger.info("DEBUG AuthTokenFilter: Extracted JWT present={} value={}", jwt != null, jwt);
            
            if (jwt != null) {
                boolean validToken = jwtUtils.validateJwtToken(jwt);
                logger.info("DEBUG AuthTokenFilter: JWT validation result={}", validToken);
                
                if (validToken) {
                    String username = jwtUtils.getUserNameFromJwtToken(jwt);
                    logger.info("DEBUG AuthTokenFilter: Username from JWT={}", username);
                    
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    logger.info("DEBUG AuthTokenFilter: UserDetails loaded username={}", userDetails.getUsername());
                    
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails, null, userDetails.getAuthorities());
                    authentication.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request));
                    
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    logger.info("DEBUG AuthTokenFilter: SecurityContextHolder.setAuthentication SUCCESS principalType={}",
                            userDetails.getClass().getName());
                } else {
                    logger.info("DEBUG AuthTokenFilter: JWT validation FAILED - SecurityContext NOT set");
                }
            } else {
                logger.info("DEBUG AuthTokenFilter: No JWT found - SecurityContext NOT set");
            }
        } catch (Exception e) {
            logger.error("DEBUG AuthTokenFilter: Exception during authentication: {}", e.getMessage());
            e.printStackTrace();
        }
        
        logger.info("DEBUG AuthTokenFilter: Proceeding to filter chain");
        filterChain.doFilter(request, response);
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");
        if (headerAuth != null && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }
        return null;
    }
}