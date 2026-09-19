package com.tripnest.exception;

import com.tripnest.dto.ErrorResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.junit.jupiter.api.Assertions.*;

public class GlobalExceptionHandlerStandardizationTest {

    private GlobalExceptionHandler exceptionHandler;
    private MockHttpServletRequest request;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
        request = new MockHttpServletRequest();
        request.setRequestURI("/api/test-endpoint");
    }

    @Test
    @DisplayName("handleResourceNotFoundException returns HTTP 404 with structured ErrorResponse")
    void testHandleResourceNotFoundException() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Trip", "id", 100L);
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleResourceNotFoundException(ex, request);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(404, response.getBody().getStatus());
        assertEquals("Not Found", response.getBody().getError());
        assertEquals("Trip not found with id: '100'", response.getBody().getMessage());
        assertEquals("/api/test-endpoint", response.getBody().getPath());
        assertNotNull(response.getBody().getTimestamp());
    }

    @Test
    @DisplayName("handleBadRequestException returns HTTP 400 for BadRequestException")
    void testHandleBadRequestException() {
        BadRequestException ex = new BadRequestException("End date must be on or after start date");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleBadRequestException(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().getStatus());
        assertEquals("Bad Request", response.getBody().getError());
        assertEquals("End date must be on or after start date", response.getBody().getMessage());
        assertEquals("/api/test-endpoint", response.getBody().getPath());
    }

    @Test
    @DisplayName("handleAccessDeniedException returns HTTP 403 for UnauthorizedAccessException")
    void testHandleUnauthorizedAccessException() {
        UnauthorizedAccessException ex = new UnauthorizedAccessException("Unauthorized");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleAccessDeniedException(ex, request);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(403, response.getBody().getStatus());
        assertEquals("Forbidden", response.getBody().getError());
        assertEquals("Unauthorized", response.getBody().getMessage());
        assertEquals("/api/test-endpoint", response.getBody().getPath());
    }

    @Test
    @DisplayName("handleGenericException returns HTTP 500 without leaking sensitive details")
    void testHandleGenericException() {
        RuntimeException ex = new RuntimeException("Unexpected internal DB connection failure");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleGenericException(ex, request);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(500, response.getBody().getStatus());
        assertEquals("Internal Server Error", response.getBody().getError());
        assertEquals("An unexpected internal server error occurred.", response.getBody().getMessage());
        assertEquals("/api/test-endpoint", response.getBody().getPath());
    }
}
