package com.tripnest.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class DisposableEmailServiceTest {

    private DisposableEmailService disposableEmailService;

    @BeforeEach
    void setUp() {
        disposableEmailService = new DisposableEmailService();
    }

    @Test
    void testIsDisposableEmail_WithKnownDisposableDomain_ReturnsTrue() {
        assertTrue(disposableEmailService.isDisposableEmail("test@mailinator.com"));
        assertTrue(disposableEmailService.isDisposableEmail("user@tempmail.com"));
        assertTrue(disposableEmailService.isDisposableEmail("admin@10minutemail.com"));
    }

    @Test
    void testIsDisposableEmail_WithLegitimateDomain_ReturnsFalse() {
        assertFalse(disposableEmailService.isDisposableEmail("test@gmail.com"));
        assertFalse(disposableEmailService.isDisposableEmail("user@yahoo.com"));
        assertFalse(disposableEmailService.isDisposableEmail("admin@outlook.com"));
    }

    @Test
    void testIsDisposableEmail_WithNullEmail_ReturnsFalse() {
        assertFalse(disposableEmailService.isDisposableEmail(null));
    }

    @Test
    void testIsDisposableEmail_WithEmptyEmail_ReturnsFalse() {
        assertFalse(disposableEmailService.isDisposableEmail(""));
    }

    @Test
    void testIsDisposableEmail_WithInvalidEmailFormat_ReturnsFalse() {
        assertFalse(disposableEmailService.isDisposableEmail("invalid-email"));
        assertFalse(disposableEmailService.isDisposableEmail("@nodomain.com"));
    }

    @Test
    void testIsDisposableEmail_CaseInsensitive() {
        assertTrue(disposableEmailService.isDisposableEmail("test@MAILINATOR.COM"));
        assertTrue(disposableEmailService.isDisposableEmail("user@TEMPMAIL.COM"));
    }

    @Test
    void testAddDisposableDomain() {
        assertFalse(disposableEmailService.isDisposableEmail("test@newdisposable.com"));
        disposableEmailService.addDisposableDomain("newdisposable.com");
        assertTrue(disposableEmailService.isDisposableEmail("test@newdisposable.com"));
    }

    @Test
    void testRemoveDisposableDomain() {
        assertTrue(disposableEmailService.isDisposableEmail("test@mailinator.com"));
        disposableEmailService.removeDisposableDomain("mailinator.com");
        assertFalse(disposableEmailService.isDisposableEmail("test@mailinator.com"));
    }

    @Test
    void testGetDisposableDomains_ReturnsNonEmptySet() {
        var domains = disposableEmailService.getDisposableDomains();
        assertNotNull(domains);
        assertFalse(domains.isEmpty());
        assertTrue(domains.contains("mailinator.com"));
    }
}