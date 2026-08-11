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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DocumentService {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TripShareService tripShareService;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private StorageService storageService;

    @Autowired
    private DocumentFileValidator documentFileValidator;

    public DocumentResponse uploadDocument(MultipartFile file, Long tripId, String documentType, Long userId) throws IOException {
        // 1. Validate File Format, MIME Type, Size, Magic Bytes, and Filename Safety
        documentFileValidator.validateFile(file);

        // 2. Validate Trip Existence & Authorization
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new IllegalArgumentException("Trip not found with ID: " + tripId));

        boolean isOwner = trip.getUser().getId().equals(userId);
        boolean hasEditAccess = tripShareService.hasEditAccess(tripId, userId);
        boolean isGroupMember = groupRepository.existsByTripIdAndMembersId(tripId, userId);
        if (!isOwner && !hasEditAccess && !isGroupMember) {
            throw new AccessDeniedException("Unauthorized: You do not have permission to upload documents to this trip.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        // 3. Generate safe UUID stored filename
        String originalFileName = file.getOriginalFilename();
        String extension = "";
        if (originalFileName != null && originalFileName.contains(".")) {
            extension = originalFileName.substring(originalFileName.lastIndexOf(".")).toLowerCase();
        }
        String storedFileName = UUID.randomUUID() + extension;

        // 4. Delegate file storage to active StorageService (Local or S3 Cloud)
        storageService.storeFile(file, storedFileName);

        // 5. Persist Document Entity
        TravelDocument document = new TravelDocument();
        document.setFileName(originalFileName);
        document.setFileType(file.getContentType());
        document.setFileUrl("/api/documents/download/" + storedFileName);
        document.setTrip(trip);
        document.setUser(user);
        if (documentType != null && !documentType.trim().isEmpty()) {
            try {
                document.setDocumentType(DocumentType.valueOf(documentType.trim().toUpperCase()));
            } catch (IllegalArgumentException e) {
                document.setDocumentType(DocumentType.OTHER);
            }
        } else {
            document.setDocumentType(DocumentType.OTHER);
        }

        TravelDocument saved = documentRepository.save(document);
        return mapToResponse(saved);
    }

    public List<DocumentResponse> getTripDocuments(Long tripId, Long userId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new IllegalArgumentException("Trip not found with ID: " + tripId));

        boolean isOwner = trip.getUser().getId().equals(userId);
        boolean hasAccess = tripShareService.hasAccess(tripId, userId);
        boolean isGroupMember = groupRepository.existsByTripIdAndMembersId(tripId, userId);
        if (!isOwner && !hasAccess && !isGroupMember) {
            throw new AccessDeniedException("Unauthorized: You do not have permission to view documents for this trip.");
        }

        return documentRepository.findByTripId(tripId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Resource getDocumentResource(String storedFileName, Long userId) throws IOException {
        // Sanitize stored filename parameter against path traversal
        if (storedFileName == null || storedFileName.contains("..") || storedFileName.contains("/") || storedFileName.contains("\\")) {
            throw new SecurityException("Illegal filename path traversal attempt.");
        }

        // Verify document authorization in database
        List<TravelDocument> docs = documentRepository.findAll();
        TravelDocument doc = docs.stream()
                .filter(d -> d.getFileUrl() != null && d.getFileUrl().endsWith("/" + storedFileName))
                .findFirst()
                .orElse(null);

        if (doc != null) {
            Trip trip = doc.getTrip();
            Long tripId = trip.getId();
            boolean isOwner = trip.getUser().getId().equals(userId);
            boolean hasAccess = tripShareService.hasAccess(tripId, userId);
            boolean isGroupMember = groupRepository.existsByTripIdAndMembersId(tripId, userId);

            if (!isOwner && !hasAccess && !isGroupMember) {
                throw new AccessDeniedException("Unauthorized: You do not have permission to download this document.");
            }
        }

        return storageService.loadFileAsResource(storedFileName);
    }

    public void deleteDocument(Long id, Long userId) throws IOException {
        TravelDocument document = documentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Document not found with ID: " + id));

        Trip trip = document.getTrip();
        boolean isDocUploader = document.getUser().getId().equals(userId);
        boolean isTripOwner = trip.getUser().getId().equals(userId);
        boolean hasEditAccess = tripShareService.hasEditAccess(trip.getId(), userId);

        if (!isDocUploader && !isTripOwner && !hasEditAccess) {
            throw new AccessDeniedException("Unauthorized: You do not have permission to delete this document.");
        }

        String fileUrl = document.getFileUrl();
        String storedFileName = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);

        storageService.deleteFile(storedFileName);
        documentRepository.delete(document);
    }

    private DocumentResponse mapToResponse(TravelDocument document) {
        DocumentResponse response = new DocumentResponse();
        response.setId(document.getId());
        response.setFileName(document.getFileName());
        response.setFileType(document.getFileType());
        response.setFileUrl(document.getFileUrl());
        response.setDocumentType(document.getDocumentType() != null ? document.getDocumentType().name() : null);
        response.setTripId(document.getTrip().getId());
        response.setTripTitle(document.getTrip().getTitle());
        response.setUserId(document.getUser().getId());
        response.setUsername(document.getUser().getUsername());
        response.setCreatedAt(document.getCreatedAt());
        return response;
    }
}