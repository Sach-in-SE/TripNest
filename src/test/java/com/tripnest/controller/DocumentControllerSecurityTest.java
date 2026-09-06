package com.tripnest.controller;

import com.tripnest.dto.DocumentDownloadResult;
import com.tripnest.exception.ResourceNotFoundException;
import com.tripnest.security.UserDetailsImpl;
import com.tripnest.service.DocumentService;
import com.tripnest.tripnest.TripnestApplication;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.web.servlet.MockMvc;

import java.io.IOException;
import java.util.Collections;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(classes = TripnestApplication.class)
@AutoConfigureMockMvc
public class DocumentControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DocumentService documentService;

    @Test
    @DisplayName("GET /api/documents/download/{fileName} - Unauthenticated request returns 401 Unauthorized")
    void testDownload_Unauthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/documents/download/uuid-ticket.pdf"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/documents/download/{fileName} - Authorized owner returns 200 with original filename, MIME type, and cache headers")
    void testDownload_AuthorizedOwner_Returns200_WithCorrectHeaders() throws Exception {
        UserDetailsImpl owner = new UserDetailsImpl(1L, "owner", "owner@test.com", "pass", Collections.emptyList());
        ByteArrayResource resource = new ByteArrayResource("%PDF-1.4 sample content".getBytes());
        DocumentDownloadResult result = new DocumentDownloadResult(resource, "flight_ticket.pdf", "application/pdf");

        when(documentService.getDocumentDownload(eq("uuid-ticket.pdf"), eq(1L))).thenReturn(result);

        mockMvc.perform(get("/api/documents/download/uuid-ticket.pdf").with(user(owner)))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", MediaType.APPLICATION_PDF_VALUE))
                .andExpect(header().string("Content-Disposition", containsString("flight_ticket.pdf")))
                .andExpect(header().string("Cache-Control", containsString("no-cache")))
                .andExpect(header().string("Cache-Control", containsString("no-store")))
                .andExpect(header().string("Pragma", "no-cache"));
    }

    @Test
    @DisplayName("GET /api/documents/download/{fileName} - Unauthorized user returns 403 Forbidden")
    void testDownload_UnauthorizedUser_Returns403() throws Exception {
        UserDetailsImpl intruder = new UserDetailsImpl(99L, "intruder", "intruder@test.com", "pass", Collections.emptyList());

        when(documentService.getDocumentDownload(eq("uuid-secret.pdf"), eq(99L)))
                .thenThrow(new AccessDeniedException("Unauthorized: You do not have permission to download this document."));

        mockMvc.perform(get("/api/documents/download/uuid-secret.pdf").with(user(intruder)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", containsString("Unauthorized")));
    }

    @Test
    @DisplayName("GET /api/documents/download/{fileName} - Missing DB document returns 404 Not Found")
    void testDownload_NonexistentInDB_Returns404() throws Exception {
        UserDetailsImpl user = new UserDetailsImpl(1L, "user", "user@test.com", "pass", Collections.emptyList());

        when(documentService.getDocumentDownload(eq("unknown-file.pdf"), eq(1L)))
                .thenThrow(new ResourceNotFoundException("Document not found with filename: unknown-file.pdf"));

        mockMvc.perform(get("/api/documents/download/unknown-file.pdf").with(user(user)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", containsString("Document not found")));
    }

    @Test
    @DisplayName("GET /api/documents/download/{fileName} - Missing physical file returns 404 Not Found")
    void testDownload_MissingPhysicalFile_Returns404() throws Exception {
        UserDetailsImpl user = new UserDetailsImpl(1L, "user", "user@test.com", "pass", Collections.emptyList());

        when(documentService.getDocumentDownload(eq("uuid-lost.pdf"), eq(1L)))
                .thenThrow(new IOException("File not found or not readable"));

        mockMvc.perform(get("/api/documents/download/uuid-lost.pdf").with(user(user)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", containsString("Resource not found")));
    }
}
