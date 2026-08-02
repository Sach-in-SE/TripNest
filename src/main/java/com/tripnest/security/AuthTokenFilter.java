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
            logger.info("AuthTokenFilter request method={} uri={}", request.getMethod(), request.getRequestURI());
            String headerAuth = request.getHeader("Authorization");
            logger.info("AuthTokenFilter Authorization header present={} value={}", headerAuth != null, headerAuth);
            String jwt = parseJwt(request);
            logger.info("AuthTokenFilter extracted JWT present={} value={}", jwt != null, jwt);
            boolean validToken = jwt != null && jwtUtils.validateJwtToken(jwt);
            logger.info("AuthTokenFilter validateJwtToken result={}", validToken);
            if (validToken) {
                String username = jwtUtils.getUserNameFromJwtToken(jwt);
                logger.info("AuthTokenFilter username from JWT={}", username);
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities());
                authentication.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
                logger.info("AuthTokenFilter SecurityContextHolder.setAuthentication called=true principalType={}",
                        userDetails.getClass().getName());
            } else {
                logger.info("AuthTokenFilter SecurityContextHolder.setAuthentication called=false");
            }
        } catch (Exception e) {
            logger.error("Cannot set user authentication: {}", e.getMessage());
        }
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