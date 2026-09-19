package com.tripnest.service;

import com.tripnest.dto.MemoryImageResponse;
import com.tripnest.dto.TravelMemoryRequest;
import com.tripnest.dto.TravelMemoryResponse;
import com.tripnest.entity.*;
import com.tripnest.exception.ResourceNotFoundException;
import com.tripnest.repository.DestinationRepository;
import com.tripnest.repository.GroupRepository;
import com.tripnest.repository.TravelMemoryImageRepository;
import com.tripnest.repository.TravelMemoryRepository;
import com.tripnest.repository.TripRepository;
import com.tripnest.repository.UserRepository;
import com.tripnest.service.storage.DocumentFileValidator;
import com.tripnest.service.storage.StorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class TravelMemoryService {

    private static final Logger logger = LoggerFactory.getLogger(TravelMemoryService.class);

    @Autowired
    private TravelMemoryRepository travelMemoryRepository;

    @Autowired
    private TravelMemoryImageRepository travelMemoryImageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private DestinationRepository destinationRepository;

    @Autowired
    private TripShareService tripShareService;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private StorageService storageService;

    @Autowired
    private DocumentFileValidator documentFileValidator;

    @Transactional
    public TravelMemoryResponse createMemory(List<MultipartFile> files, TravelMemoryRequest request, Long userId) throws IOException {
        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("At least one photo is required to create a travel memory.");
        }
        if (files.size() > 5) {
            throw new IllegalArgumentException("Maximum 5 photos allowed per travel memory.");
        }

        // 1. Security & MIME Validation for all files upfront before storing any file
        for (MultipartFile file : files) {
            documentFileValidator.validateImageFile(file);
        }

        // 2. Validate User
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        // 3. Resolve Optional Trip & Access
        Trip trip = null;
        if (request.getTripId() != null) {
            trip = tripRepository.findById(request.getTripId())
                    .orElseThrow(() -> new IllegalArgumentException("Trip not found with ID: " + request.getTripId()));

            boolean isOwner = trip.getUser().getId().equals(userId);
            boolean hasAccess = tripShareService.hasAccess(trip.getId(), userId);
            boolean isGroupMember = groupRepository.existsByTripIdAndMembersId(trip.getId(), userId);
            if (!isOwner && !hasAccess && !isGroupMember) {
                throw new AccessDeniedException("Unauthorized: You do not have permission to associate memories with this trip.");
            }
        }

        // 4. Resolve Optional Destination
        Destination destination = null;
        if (request.getDestinationId() != null) {
            destination = destinationRepository.findById(request.getDestinationId())
                    .orElse(null);
        }

        // 5. Parse Visibility
        MemoryVisibility visibility = parseVisibility(request.getVisibility());

        // 6. Build Parent Travel Memory
        TravelMemory memory = new TravelMemory();
        memory.setTitle(request.getTitle().trim());
        memory.setCaption(request.getCaption() != null ? request.getCaption().trim() : null);
        memory.setLocationName(request.getLocationName() != null ? request.getLocationName().trim() : null);
        memory.setVisibility(visibility);
        memory.setTrip(trip);
        memory.setDestination(destination);
        memory.setUser(user);

        // 7. Store files with atomic cleanup tracking
        List<String> storedFileNames = new ArrayList<>();
        try {
            for (int i = 0; i < files.size(); i++) {
                MultipartFile file = files.get(i);
                String originalFileName = file.getOriginalFilename();
                String extension = "";
                if (originalFileName != null && originalFileName.contains(".")) {
                    extension = originalFileName.substring(originalFileName.lastIndexOf(".")).toLowerCase();
                }
                String storedFileName = "memory_" + UUID.randomUUID() + extension;

                storageService.storeFile(file, storedFileName);
                storedFileNames.add(storedFileName);

                String fileUrl = "/api/memories/photo/" + storedFileName;

                TravelMemoryImage imageEntity = new TravelMemoryImage();
                imageEntity.setTravelMemory(memory);
                imageEntity.setStoredFileName(storedFileName);
                imageEntity.setFileUrl(fileUrl);
                imageEntity.setOriginalFileName(originalFileName);
                imageEntity.setContentType(file.getContentType());
                imageEntity.setFileSize(file.getSize());
                imageEntity.setDisplayOrder(i);

                memory.getImages().add(imageEntity);

                // Set legacy cover fields for first image (displayOrder = 0)
                if (i == 0) {
                    memory.setStoredFileName(storedFileName);
                    memory.setImageUrl(fileUrl);
                }
            }

            TravelMemory saved = travelMemoryRepository.save(memory);
            return mapToResponse(saved, userId);
        } catch (Exception e) {
            // Compensating storage cleanup if storage or DB persistence fails
            for (String fName : storedFileNames) {
                try {
                    storageService.deleteFile(fName);
                } catch (Exception cleanupEx) {
                    logger.warn("Failed to cleanup file {} after memory creation error: {}", fName, cleanupEx.getMessage());
                }
            }
            if (e instanceof IOException) {
                throw (IOException) e;
            } else if (e instanceof RuntimeException) {
                throw (RuntimeException) e;
            } else {
                throw new IOException("Failed to create travel memory", e);
            }
        }
    }

    @Transactional
    public TravelMemoryResponse createMemory(MultipartFile file, TravelMemoryRequest request, Long userId) throws IOException {
        return createMemory(file != null ? List.of(file) : Collections.emptyList(), request, userId);
    }

    @Transactional(readOnly = true)
    public List<TravelMemoryResponse> getUserMemories(Long userId) {
        return travelMemoryRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(m -> mapToResponse(m, userId))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<TravelMemoryResponse> getUserMemories(Long userId, org.springframework.data.domain.Pageable pageable) {
        return travelMemoryRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(m -> mapToResponse(m, userId));
    }

    @Transactional(readOnly = true)
    public List<TravelMemoryResponse> getPublicMemories(Long currentUserIdOrNull) {
        return travelMemoryRepository.findByVisibilityOrderByCreatedAtDesc(MemoryVisibility.PUBLIC)
                .stream()
                .map(m -> mapToResponse(m, currentUserIdOrNull))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<TravelMemoryResponse> getPublicMemories(Long currentUserIdOrNull, org.springframework.data.domain.Pageable pageable) {
        return travelMemoryRepository.findByVisibilityOrderByCreatedAtDesc(MemoryVisibility.PUBLIC, pageable)
                .map(m -> mapToResponse(m, currentUserIdOrNull));
    }

    @Transactional(readOnly = true)
    public List<TravelMemoryResponse> getTop3PublicMemoriesByDestination(Long destinationId) {
        if (destinationId == null) {
            return java.util.Collections.emptyList();
        }
        return travelMemoryRepository.findTop3ByDestinationIdAndVisibilityOrderByCreatedAtDesc(
                destinationId, MemoryVisibility.PUBLIC)
                .stream()
                .map(m -> mapToResponse(m, null))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<TravelMemoryResponse> getPublicMemoriesByDestination(
            Long destinationId, org.springframework.data.domain.Pageable pageable) {
        if (destinationId == null) {
            return org.springframework.data.domain.Page.empty(pageable);
        }
        return travelMemoryRepository.findByDestinationIdAndVisibilityOrderByCreatedAtDesc(
                destinationId, MemoryVisibility.PUBLIC, pageable)
                .map(m -> mapToResponse(m, null));
    }

    @Transactional(readOnly = true)
    public List<TravelMemoryResponse> getPublicMemoriesByDestination(Long destinationId) {
        if (destinationId == null) {
            return java.util.Collections.emptyList();
        }
        return travelMemoryRepository.findByDestinationIdAndVisibilityOrderByCreatedAtDesc(
                destinationId, MemoryVisibility.PUBLIC)
                .stream()
                .map(m -> mapToResponse(m, null))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TravelMemoryResponse getMemoryById(Long id, Long currentUserIdOrNull) {
        TravelMemory memory = travelMemoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Travel memory not found with ID: " + id));

        if (memory.getVisibility() == MemoryVisibility.PRIVATE) {
            if (currentUserIdOrNull == null || !currentUserIdOrNull.equals(memory.getUser().getId())) {
                throw new AccessDeniedException("Unauthorized: This travel memory is private.");
            }
        }

        return mapToResponse(memory, currentUserIdOrNull);
    }

    @Transactional
    public TravelMemoryResponse updateMemory(Long id, TravelMemoryRequest request, Long userId) {
        TravelMemory memory = travelMemoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Travel memory not found with ID: " + id));

        if (!memory.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("Unauthorized: You do not have permission to edit this travel memory.");
        }

        if (request.getTitle() != null && !request.getTitle().trim().isEmpty()) {
            memory.setTitle(request.getTitle().trim());
        }

        if (request.getCaption() != null) {
            memory.setCaption(request.getCaption().trim());
        }

        if (request.getLocationName() != null) {
            memory.setLocationName(request.getLocationName().trim());
        }

        if (request.getVisibility() != null) {
            memory.setVisibility(parseVisibility(request.getVisibility()));
        }

        if (request.getTripId() != null) {
            Trip trip = tripRepository.findById(request.getTripId())
                    .orElseThrow(() -> new IllegalArgumentException("Trip not found with ID: " + request.getTripId()));
            memory.setTrip(trip);
        }

        if (request.getDestinationId() != null) {
            Destination destination = destinationRepository.findById(request.getDestinationId())
                    .orElse(null);
            memory.setDestination(destination);
        }

        TravelMemory updated = travelMemoryRepository.save(memory);
        return mapToResponse(updated, userId);
    }

    @Transactional
    public void deleteMemory(Long id, Long userId) throws IOException {
        TravelMemory memory = travelMemoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Travel memory not found with ID: " + id));

        if (!memory.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("Unauthorized: You do not have permission to delete this travel memory.");
        }

        // Collect all physical files to clean up
        Set<String> filesToDelete = new HashSet<>();
        if (memory.getImages() != null) {
            for (TravelMemoryImage img : memory.getImages()) {
                if (img.getStoredFileName() != null && !img.getStoredFileName().trim().isEmpty()) {
                    filesToDelete.add(img.getStoredFileName().trim());
                }
            }
        }
        if (memory.getStoredFileName() != null && !memory.getStoredFileName().trim().isEmpty()) {
            filesToDelete.add(memory.getStoredFileName().trim());
        }

        for (String fName : filesToDelete) {
            try {
                storageService.deleteFile(fName);
            } catch (Exception e) {
                logger.warn("Failed to delete physical photo file {}: {}", fName, e.getMessage());
            }
        }

        travelMemoryRepository.delete(memory);
    }

    @Transactional(readOnly = true)
    public Resource getMemoryPhotoResource(String storedFileName, Long currentUserIdOrNull) throws IOException {
        if (storedFileName == null || storedFileName.contains("..") || storedFileName.contains("/") || storedFileName.contains("\\")) {
            throw new SecurityException("Illegal filename path traversal attempt.");
        }

        // 1. Search child TravelMemoryImage first
        Optional<TravelMemoryImage> imageOpt = travelMemoryImageRepository.findByStoredFileName(storedFileName);
        TravelMemory memory = null;
        if (imageOpt.isPresent()) {
            memory = imageOpt.get().getTravelMemory();
        } else {
            // 2. Fallback to legacy TravelMemory
            memory = travelMemoryRepository.findByStoredFileName(storedFileName).orElse(null);
        }

        // 3. FAIL-CLOSE: If no DB record exists, reject immediately — NEVER touch storage for non-existent records
        if (memory == null) {
            throw new ResourceNotFoundException("Photo not found with filename: " + storedFileName);
        }

        // 4. Authorization check: Private photos require authenticated owner
        if (memory.getVisibility() == MemoryVisibility.PRIVATE) {
            if (currentUserIdOrNull == null || !currentUserIdOrNull.equals(memory.getUser().getId())) {
                throw new AccessDeniedException("Unauthorized: This travel photo is private.");
            }
        }

        return storageService.loadFileAsResource(storedFileName);
    }

    @Transactional(readOnly = true)
    public MemoryVisibility getPhotoVisibility(String storedFileName) {
        Optional<TravelMemoryImage> imageOpt = travelMemoryImageRepository.findByStoredFileName(storedFileName);
        if (imageOpt.isPresent() && imageOpt.get().getTravelMemory() != null) {
            return imageOpt.get().getTravelMemory().getVisibility();
        }
        return travelMemoryRepository.findByStoredFileName(storedFileName)
                .map(TravelMemory::getVisibility)
                .orElse(MemoryVisibility.PRIVATE);
    }

    private MemoryVisibility parseVisibility(String visibilityStr) {
        if (visibilityStr != null && "PUBLIC".equalsIgnoreCase(visibilityStr.trim())) {
            return MemoryVisibility.PUBLIC;
        }
        return MemoryVisibility.PRIVATE;
    }

    private TravelMemoryResponse mapToResponse(TravelMemory memory, Long currentUserIdOrNull) {
        TravelMemoryResponse res = new TravelMemoryResponse();
        res.setId(memory.getId());
        res.setTitle(memory.getTitle());
        res.setCaption(memory.getCaption());
        res.setLocationName(memory.getLocationName());
        res.setVisibility(memory.getVisibility().name());

        if (memory.getTrip() != null) {
            res.setTripId(memory.getTrip().getId());
            res.setTripTitle(memory.getTrip().getTitle());
        }

        if (memory.getDestination() != null) {
            res.setDestinationId(memory.getDestination().getId());
            res.setDestinationName(memory.getDestination().getName());
        }

        User user = memory.getUser();
        res.setUserId(user.getId());
        String name = user.getFirstName() != null && user.getLastName() != null
                ? user.getFirstName() + " " + user.getLastName()
                : user.getUsername();
        res.setUserName(name);
        res.setUserAvatarInitial(name != null && !name.isEmpty() ? name.substring(0, 1).toUpperCase() : "T");

        res.setCreatedAt(memory.getCreatedAt());
        res.setUpdatedAt(memory.getUpdatedAt());
        res.setOwner(currentUserIdOrNull != null && currentUserIdOrNull.equals(user.getId()));

        List<MemoryImageResponse> imageResponses = new ArrayList<>();
        if (memory.getImages() != null && !memory.getImages().isEmpty()) {
            List<TravelMemoryImage> sortedImages = new ArrayList<>(memory.getImages());
            sortedImages.sort((a, b) -> Integer.compare(a.getDisplayOrder(), b.getDisplayOrder()));
            for (TravelMemoryImage img : sortedImages) {
                imageResponses.add(MemoryImageResponse.builder()
                        .id(img.getId())
                        .imageUrl(img.getFileUrl())
                        .fileUrl(img.getFileUrl())
                        .storedFileName(img.getStoredFileName())
                        .originalFileName(img.getOriginalFileName())
                        .contentType(img.getContentType())
                        .fileSize(img.getFileSize())
                        .displayOrder(img.getDisplayOrder())
                        .build());
            }
            res.setImages(imageResponses);
            res.setImageUrl(imageResponses.get(0).getFileUrl());
            res.setStoredFileName(imageResponses.get(0).getStoredFileName());
        } else if (memory.getImageUrl() != null || memory.getStoredFileName() != null) {
            // Legacy fallback for memories created before multi-image support
            MemoryImageResponse fallback = MemoryImageResponse.builder()
                    .imageUrl(memory.getImageUrl())
                    .fileUrl(memory.getImageUrl())
                    .storedFileName(memory.getStoredFileName())
                    .displayOrder(0)
                    .build();
            res.setImages(List.of(fallback));
            res.setImageUrl(memory.getImageUrl());
            res.setStoredFileName(memory.getStoredFileName());
        } else {
            res.setImages(Collections.emptyList());
            res.setImageUrl(null);
            res.setStoredFileName(null);
        }

        return res;
    }
}
