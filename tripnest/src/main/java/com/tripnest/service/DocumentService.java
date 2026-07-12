package com.tripnest.service;

import com.tripnest.dto.DocumentResponse;
import com.tripnest.entity.DocumentType;
import com.tripnest.entity.TravelDocument;
import com.tripnest.entity.Trip;
import com.tripnest.entity.User;
import com.tripnest.repository.DocumentRepository;
import com.tripnest.repository.TripRepository;
import com.tripnest.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
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

    @Value("${tripnest.upload.dir:uploads}")
    private String uploadDir;

    public DocumentResponse uploadDocument(MultipartFile file, Long tripId, String documentType, Long userId) throws IOException {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        if (!trip.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String originalFileName = file.getOriginalFilename();
        String extension = "";
        if (originalFileName != null && originalFileName.contains(".")) {
            extension = originalFileName.substring(originalFileName.lastIndexOf("."));
        }
        String storedFileName = UUID.randomUUID() + extension;

        Path targetPath = uploadPath.resolve(storedFileName);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        TravelDocument document = new TravelDocument();
        document.setFileName(originalFileName);
        document.setFileType(file.getContentType());
        document.setFileUrl("/api/documents/download/" + storedFileName);
        document.setTrip(trip);
        document.setUser(user);
        if (documentType != null) {
            document.setDocumentType(DocumentType.valueOf(documentType));
        }

        TravelDocument saved = documentRepository.save(document);
        return mapToResponse(saved);
    }

    public List<DocumentResponse> getTripDocuments(Long tripId, Long userId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        if (!trip.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        return documentRepository.findByTripId(tripId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public void deleteDocument(Long id, Long userId) throws IOException {
        TravelDocument document = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        if (!document.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        String storedFileName = document.getFileUrl().substring(document.getFileUrl().lastIndexOf("/") + 1);
        Path filePath = Paths.get(uploadDir).resolve(storedFileName);
        Files.deleteIfExists(filePath);

        documentRepository.delete(document);
    }

    public Path getFilePath(String storedFileName) {
        return Paths.get(uploadDir).resolve(storedFileName);
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