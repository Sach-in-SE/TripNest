package com.tripnest.service;

import com.tripnest.dto.DocumentResponse;
import com.tripnest.entity.DocumentType;
import com.tripnest.entity.TravelDocument;
import com.tripnest.entity.Trip;
import com.tripnest.entity.User;
import com.tripnest.repository.DocumentRepository;
import com.tripnest.repository.GroupRepository;
import com.tripnest.repository.TripRepository;
import com.tripnest.repository.UserRepository;
import com.tripnest.service.storage.DocumentFileValidator;
import com.tripnest.service.storage.StorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DocumentServiceTest {

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private TripRepository tripRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TripShareService tripShareService;

    @Mock
    private GroupRepository groupRepository;

    @Mock
    private StorageService storageService;

    @Mock
    private DocumentFileValidator documentFileValidator;

    @InjectMocks
    private DocumentService documentService;

    private User owner;
    private User unauthorizedUser;
    private Trip trip;

    @BeforeEach
    void setUp() {
        owner = new User();
        owner.setId(1L);
        owner.setUsername("owner");

        unauthorizedUser = new User();
        unauthorizedUser.setId(2L);
        unauthorizedUser.setUsername("unauthorized");

        trip = new Trip();
        trip.setId(10L);
        trip.setTitle("Paris Trip");
        trip.setUser(owner);
    }

    @Test
    @DisplayName("Upload document succeeds for trip owner with valid PDF file")
    void testUploadDocument_Success() throws IOException {
        byte[] pdfHeader = "%PDF-1.5 test document content".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file", "ticket.pdf", "application/pdf", pdfHeader
        );

        when(tripRepository.findById(10L)).thenReturn(Optional.of(trip));
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        when(storageService.storeFile(any(), anyString())).thenReturn("uuid-ticket.pdf");

        TravelDocument savedDoc = new TravelDocument();
        savedDoc.setId(100L);
        savedDoc.setFileName("ticket.pdf");
        savedDoc.setFileType("application/pdf");
        savedDoc.setFileUrl("/api/documents/download/uuid-ticket.pdf");
        savedDoc.setDocumentType(DocumentType.TICKET);
        savedDoc.setTrip(trip);
        savedDoc.setUser(owner);

        when(documentRepository.save(any(TravelDocument.class))).thenReturn(savedDoc);

        DocumentResponse response = documentService.uploadDocument(file, 10L, "TICKET", 1L);

        assertNotNull(response);
        assertEquals(100L, response.getId());
        assertEquals("ticket.pdf", response.getFileName());
        assertEquals("TICKET", response.getDocumentType());
        verify(documentFileValidator).validateFile(file);
        verify(storageService).storeFile(eq(file), anyString());
    }

    @Test
    @DisplayName("Upload document throws AccessDeniedException for unauthorized non-member")
    void testUploadDocument_Unauthorized() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "ticket.pdf", "application/pdf", "%PDF-1.5 test".getBytes()
        );

        when(tripRepository.findById(10L)).thenReturn(Optional.of(trip));
        when(tripShareService.hasEditAccess(10L, 2L)).thenReturn(false);
        when(groupRepository.existsByTripIdAndMembersId(10L, 2L)).thenReturn(false);

        assertThrows(AccessDeniedException.class, () ->
                documentService.uploadDocument(file, 10L, "TICKET", 2L)
        );
    }

    @Test
    @DisplayName("Get trip documents succeeds for authorized user")
    void testGetTripDocuments_Success() {
        when(tripRepository.findById(10L)).thenReturn(Optional.of(trip));

        TravelDocument doc = new TravelDocument();
        doc.setId(100L);
        doc.setFileName("booking.pdf");
        doc.setTrip(trip);
        doc.setUser(owner);

        when(documentRepository.findByTripId(10L)).thenReturn(Collections.singletonList(doc));

        List<DocumentResponse> result = documentService.getTripDocuments(10L, 1L);

        assertEquals(1, result.size());
        assertEquals("booking.pdf", result.get(0).getFileName());
    }

    @Test
    @DisplayName("Get trip documents throws AccessDeniedException for unauthorized user")
    void testGetTripDocuments_Unauthorized() {
        when(tripRepository.findById(10L)).thenReturn(Optional.of(trip));
        when(tripShareService.hasAccess(10L, 2L)).thenReturn(false);
        when(groupRepository.existsByTripIdAndMembersId(10L, 2L)).thenReturn(false);

        assertThrows(AccessDeniedException.class, () ->
                documentService.getTripDocuments(10L, 2L)
        );
    }

    @Test
    @DisplayName("Get document resource succeeds for owner")
    void testGetDocumentResource_Success() throws IOException {
        TravelDocument doc = new TravelDocument();
        doc.setId(100L);
        doc.setFileName("passport.pdf");
        doc.setFileUrl("/api/documents/download/uuid-passport.pdf");
        doc.setTrip(trip);
        doc.setUser(owner);

        when(documentRepository.findAll()).thenReturn(Collections.singletonList(doc));
        Resource mockResource = new ByteArrayResource("%PDF content".getBytes());
        when(storageService.loadFileAsResource("uuid-passport.pdf")).thenReturn(mockResource);

        Resource result = documentService.getDocumentResource("uuid-passport.pdf", 1L);

        assertNotNull(result);
        verify(storageService).loadFileAsResource("uuid-passport.pdf");
    }

    @Test
    @DisplayName("Get document resource throws SecurityException on path traversal attempt")
    void testGetDocumentResource_PathTraversal() {
        assertThrows(SecurityException.class, () ->
                documentService.getDocumentResource("../secret.txt", 1L)
        );
    }

    @Test
    @DisplayName("Delete document succeeds for uploader/owner")
    void testDeleteDocument_Success() throws IOException {
        TravelDocument doc = new TravelDocument();
        doc.setId(100L);
        doc.setFileName("old.pdf");
        doc.setFileUrl("/api/documents/download/uuid-old.pdf");
        doc.setTrip(trip);
        doc.setUser(owner);

        when(documentRepository.findById(100L)).thenReturn(Optional.of(doc));

        documentService.deleteDocument(100L, 1L);

        verify(storageService).deleteFile("uuid-old.pdf");
        verify(documentRepository).delete(doc);
    }

    @Test
    @DisplayName("Delete document throws AccessDeniedException for non-member")
    void testDeleteDocument_Unauthorized() {
        TravelDocument doc = new TravelDocument();
        doc.setId(100L);
        doc.setTrip(trip);
        doc.setUser(owner);

        when(documentRepository.findById(100L)).thenReturn(Optional.of(doc));
        when(tripShareService.hasEditAccess(10L, 2L)).thenReturn(false);

        assertThrows(AccessDeniedException.class, () ->
                documentService.deleteDocument(100L, 2L)
        );
    }
}
