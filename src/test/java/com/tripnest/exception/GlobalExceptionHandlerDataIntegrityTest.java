package com.tripnest.exception;

import com.tripnest.dto.ErrorResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = com.tripnest.tripnest.TripnestApplication.class)
@AutoConfigureMockMvc
public class GlobalExceptionHandlerDataIntegrityTest {

    @Autowired
    private GlobalExceptionHandler exceptionHandler;

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("GlobalExceptionHandler translates DataIntegrityViolationException to 409 CONFLICT without leaking internals")
    void testHandleDataIntegrityViolationExceptionDirectly() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/test-conflict");

        DataIntegrityViolationException exception = new DataIntegrityViolationException(
                "ERROR: duplicate key value violates unique constraint \"uk_users_username\" Key (username)=(admin) already exists.; SQL [insert into users...]"
        );

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleDataIntegrityViolationException(exception, request);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(409, response.getBody().getStatus());
        assertEquals("Conflict", response.getBody().getError());
        assertEquals("/api/test-conflict", response.getBody().getPath());

        // Verify internals are NOT exposed
        String message = response.getBody().getMessage();
        assertFalse(message.contains("uk_users_username"), "Database constraint name must not be leaked");
        assertFalse(message.contains("insert into users"), "SQL statement must not be leaked");
        assertFalse(message.contains("ERROR:"), "Raw database error must not be leaked");
        assertTrue(message.contains("data integrity conflict") || message.contains("conflict"),
                "Safe user-facing message should be returned");
    }
}
