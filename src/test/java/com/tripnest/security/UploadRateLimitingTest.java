package com.tripnest.security;

import com.tripnest.dto.DocumentResponse;
import com.tripnest.dto.TravelMemoryResponse;
import com.tripnest.service.DocumentService;
import com.tripnest.service.TravelMemoryService;
import com.tripnest.tripnest.TripnestApplication;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(classes = TripnestApplication.class)
@AutoConfigureMockMvc
public class UploadRateLimitingTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RateLimitingFilter rateLimitingFilter;

    @MockitoBean
    private DocumentService documentService;

    @MockitoBean
    private TravelMemoryService travelMemoryService;

    private UserDetailsImpl testUser;

    @BeforeEach
    void setUp() {
        rateLimitingFilter.resetCounts();
        rateLimitingFilter.setClock(Clock.systemUTC());
        rateLimitingFilter.setDocumentUploadLimit(5);
        rateLimitingFilter.setMemoryUploadLimit(5);

        testUser = new UserDetailsImpl(
                10L,
                "uploadUser",
                "upload@test.com",
                "password",
                List.of(new SimpleGrantedAuthority("ROLE_TRAVELER"))
        );
    }

    // ---------------------------------------------------------------------------------------------
    // Document Upload Rate Limiting Tests
    // ---------------------------------------------------------------------------------------------
    @Test
    @DisplayName("Document Upload Rate Limiting: Normal request within limit is allowed")
    void testDocumentUpload_NormalRequest_Allowed() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "ticket.pdf", "application/pdf", "%PDF-1.4 test".getBytes()
        );
        when(documentService.uploadDocument(any(), any(), any(), any()))
                .thenReturn(new DocumentResponse());

        mockMvc.perform(multipart("/api/documents/upload")
                        .file(file)
                        .param("tripId", "1")
                        .with(user(testUser)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Document Upload Rate Limiting: Requests up to limit succeed, exceeding limit returns 429, reset allows requests again")
    void testDocumentUpload_RateLimitLifecycle() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "ticket.pdf", "application/pdf", "%PDF-1.4 test".getBytes()
        );
        when(documentService.uploadDocument(any(), any(), any(), any()))
                .thenReturn(new DocumentResponse());

        // Configured limit is 5 requests per minute
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(multipart("/api/documents/upload")
                            .file(file)
                            .param("tripId", "1")
                            .with(user(testUser)))
                    .andExpect(status().isOk());
        }

        // 6th request must be rejected with 429 Too Many Requests
        mockMvc.perform(multipart("/api/documents/upload")
                        .file(file)
                        .param("tripId", "1")
                        .with(user(testUser)))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().string("Retry-After", "60"))
                .andExpect(jsonPath("$.status").value(429))
                .andExpect(jsonPath("$.error").value("Too Many Requests"));

        // Advance clock past the 1-minute sliding window (simulate window reset)
        rateLimitingFilter.setClock(Clock.offset(Clock.systemUTC(), Duration.ofSeconds(65)));

        // After window reset, upload is allowed again
        mockMvc.perform(multipart("/api/documents/upload")
                        .file(file)
                        .param("tripId", "1")
                        .with(user(testUser)))
                .andExpect(status().isOk());
    }

    // ---------------------------------------------------------------------------------------------
    // Travel Memory Upload Rate Limiting Tests
    // ---------------------------------------------------------------------------------------------
    @Test
    @DisplayName("Memory Upload Rate Limiting: Normal request within limit is allowed")
    void testMemoryUpload_NormalRequest_Allowed() throws Exception {
        MockMultipartFile photo = new MockMultipartFile(
                "photo", "vacation.jpg", "image/jpeg", new byte[]{ (byte) 0xFF, (byte) 0xD8, (byte) 0xFF }
        );
        when(travelMemoryService.createMemory(anyList(), any(), any()))
                .thenReturn(new TravelMemoryResponse());

        mockMvc.perform(multipart("/api/memories")
                        .file(photo)
                        .param("title", "Great Vacation")
                        .with(user(testUser)))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("Memory Upload Rate Limiting: Requests up to limit succeed, exceeding limit returns 429, reset allows requests again")
    void testMemoryUpload_RateLimitLifecycle() throws Exception {
        MockMultipartFile photo = new MockMultipartFile(
                "photo", "vacation.jpg", "image/jpeg", new byte[]{ (byte) 0xFF, (byte) 0xD8, (byte) 0xFF }
        );
        when(travelMemoryService.createMemory(anyList(), any(), any()))
                .thenReturn(new TravelMemoryResponse());

        // Configured limit is 5 requests per minute
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(multipart("/api/memories")
                            .file(photo)
                            .param("title", "Vacation " + i)
                            .with(user(testUser)))
                    .andExpect(status().isCreated());
        }

        // 6th request must be rejected with 429 Too Many Requests
        mockMvc.perform(multipart("/api/memories")
                        .file(photo)
                        .param("title", "Exceeded Vacation")
                        .with(user(testUser)))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().string("Retry-After", "60"))
                .andExpect(jsonPath("$.status").value(429))
                .andExpect(jsonPath("$.error").value("Too Many Requests"));

        // Advance clock past the 1-minute sliding window (simulate window reset)
        rateLimitingFilter.setClock(Clock.offset(Clock.systemUTC(), Duration.ofSeconds(65)));

        // After window reset, memory creation is allowed again
        mockMvc.perform(multipart("/api/memories")
                        .file(photo)
                        .param("title", "Allowed Vacation")
                        .with(user(testUser)))
                .andExpect(status().isCreated());
    }
}
