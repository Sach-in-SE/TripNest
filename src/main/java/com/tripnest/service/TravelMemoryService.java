package com.tripnest.service;

import com.tripnest.dto.TravelMemoryRequest;
import com.tripnest.dto.TravelMemoryResponse;
import com.tripnest.entity.*;
import com.tripnest.repository.DestinationRepository;
import com.tripnest.repository.GroupRepository;
import com.tripnest.repository.TravelMemoryRepository;
import com.tripnest.repository.TripRepository;
import com.tripnest.repository.UserRepository;
import com.tripnest.service.storage.DocumentFileValidator;
import com.tripnest.service.storage.StorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TravelMemoryService {

    @Autowired
    private TravelMemoryRepository travelMemoryRepository;

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
    public TravelMemoryResponse createMemory(MultipartFile file, TravelMemoryRequest request, Long userId) throws IOException {
        // 1. Security & MIME Validation for image
        documentFileValidator.validateImageFile(file);

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

        // 5. Generate unique safe stored filename
        String originalFileName = file.getOriginalFilename();
        String extension = "";
        if (originalFileName != null && originalFileName.contains(".")) {
            extension = originalFileName.substring(originalFileName.lastIndexOf(".")).toLowerCase();
        }
        String storedFileName = "memory_" + UUID.randomUUID() + extension;

        // 6. Delegate upload to active StorageService (Local Disk or S3 Cloud)
        storageService.storeFile(file, storedFileName);

        // 7. Parse Visibility
        MemoryVisibility visibility = parseVisibility(request.getVisibility());

        // 8. Persist Travel Memory
        TravelMemory memory = new TravelMemory();
        memory.setTitle(request.getTitle().trim());
        memory.setCaption(request.getCaption() != null ? request.getCaption().trim() : null);
        memory.setLocationName(request.getLocationName() != null ? request.getLocationName().trim() : null);
        memory.setStoredFileName(storedFileName);
        memory.setImageUrl("/api/memories/photo/" + storedFileName);
        memory.setVisibility(visibility);
        memory.setTrip(trip);
        memory.setDestination(destination);
        memory.setUser(user);

        TravelMemory saved = travelMemoryRepository.save(memory);
        return mapToResponse(saved, userId);
    }

    @Transactional(readOnly = true)
    public List<TravelMemoryResponse> getUserMemories(Long userId) {
        return travelMemoryRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(m -> mapToResponse(m, userId))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TravelMemoryResponse> getPublicMemories(Long currentUserIdOrNull) {
        return travelMemoryRepository.findByVisibilityOrderByCreatedAtDesc(MemoryVisibility.PUBLIC)
                .stream()
                .map(m -> mapToResponse(m, currentUserIdOrNull))
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

        if (memory.getStoredFileName() != null) {
            storageService.deleteFile(memory.getStoredFileName());
        }

        travelMemoryRepository.delete(memory);
    }

    @Transactional(readOnly = true)
    public Resource getMemoryPhotoResource(String storedFileName, Long currentUserIdOrNull) throws IOException {
        if (storedFileName == null || storedFileName.contains("..") || storedFileName.contains("/") || storedFileName.contains("\\")) {
            throw new SecurityException("Illegal filename path traversal attempt.");
        }

        TravelMemory memory = travelMemoryRepository.findByStoredFileName(storedFileName).orElse(null);

        if (memory != null && memory.getVisibility() == MemoryVisibility.PRIVATE) {
            if (currentUserIdOrNull == null || !currentUserIdOrNull.equals(memory.getUser().getId())) {
                throw new AccessDeniedException("Unauthorized: This travel photo is private.");
            }
        }

        return storageService.loadFileAsResource(storedFileName);
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
        res.setImageUrl(memory.getImageUrl());
        res.setStoredFileName(memory.getStoredFileName());
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

        return res;
    }
}
