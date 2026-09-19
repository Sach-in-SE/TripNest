package com.tripnest.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.security.Key;
import java.util.Date;

@Component
public class JwtUtils {
    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

    @Value("${tripnest.app.jwtSecret}")
    private String jwtSecret;

    @Value("${tripnest.app.jwtExpirationMs}")
    private int jwtExpirationMs;

    @org.springframework.beans.factory.annotation.Autowired
    private org.springframework.core.env.Environment environment;

    @jakarta.annotation.PostConstruct
    public void validateJwtSecret() {
        if (environment != null && java.util.Arrays.asList(environment.getActiveProfiles()).contains("prod")) {
            if (jwtSecret == null || jwtSecret.trim().isEmpty() ||
                jwtSecret.contains("tripnest-development-only-change-me-secret-key") ||
                jwtSecret.length() < 32) {
                throw new IllegalStateException("CRITICAL SECURITY ERROR: In production profile, a secure JWT_SECRET environment variable (minimum 32 characters, non-default) MUST be provided!");
            }
        }
    }

    public String generateJwtToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(key(), SignatureAlgorithm.HS256)
                .compact();
    }

    private Key key() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    public String getUserNameFromJwtToken(String token) {
        return Jwts.parserBuilder().setSigningKey(key()).build()
                .parseClaimsJws(token).getBody().getSubject();
    }

    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(key()).build().parseClaimsJws(authToken);
            return true;
        } catch (io.jsonwebtoken.security.SecurityException e) {
            logger.error("Invalid JWT signature: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            logger.error("Invalid JWT token: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            logger.error("JWT token is expired: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            logger.error("JWT token is unsupported: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.error("JWT claims string is empty: {}", e.getMessage());
        } catch (JwtException e) {
            logger.error("JWT validation error: {}", e.getMessage());
        }
        return false;
    }
}