package com.tripnest.security.oauth2;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service managing cryptographically secure, short-lived, single-use
 * exchange codes for Google OAuth2 authentication handoff.
 */
@Service
public class OAuth2ExchangeCodeService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final long CODE_TTL_SECONDS = 30L;

    private static class ExchangeEntry {
        private final String username;
        private final Instant expiresAt;

        public ExchangeEntry(String username, Instant expiresAt) {
            this.username = username;
            this.expiresAt = expiresAt;
        }

        public String getUsername() {
            return username;
        }

        public boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }
    }

    private final Map<String, ExchangeEntry> codeStore = new ConcurrentHashMap<>();

    /**
     * Generates a cryptographically random, single-use exchange code associated with a user.
     *
     * @param username the username of the authenticated user
     * @return the exchange code string (not a JWT)
     */
    public String createExchangeCode(String username) {
        cleanupExpiredCodes();

        byte[] randomBytes = new byte[32];
        SECURE_RANDOM.nextBytes(randomBytes);
        String code = "tn_oec_" + Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        Instant expiresAt = Instant.now().plusSeconds(CODE_TTL_SECONDS);
        codeStore.put(code, new ExchangeEntry(username, expiresAt));

        return code;
    }

    /**
     * Atomically consumes and burns an exchange code on read (Single-Use).
     *
     * @param code the exchange code to validate and consume
     * @return the associated username, or null if the code is invalid, expired, or already used
     */
    public String consumeExchangeCode(String code) {
        if (code == null || code.isBlank()) {
            return null;
        }

        ExchangeEntry entry = codeStore.remove(code);
        if (entry == null) {
            return null;
        }

        if (entry.isExpired()) {
            return null;
        }

        return entry.getUsername();
    }

    private void cleanupExpiredCodes() {
        if (codeStore.size() > 50) {
            codeStore.entrySet().removeIf(e -> e.getValue().isExpired());
        }
    }

    /**
     * Resets the code store (primarily for unit testing isolation).
     */
    public void reset() {
        codeStore.clear();
    }

    public int getActiveCodeCount() {
        cleanupExpiredCodes();
        return codeStore.size();
    }
}
