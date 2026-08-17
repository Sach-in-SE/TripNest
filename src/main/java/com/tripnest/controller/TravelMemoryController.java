package com.tripnest.controller;

import com.tripnest.dto.MessageResponse;
import com.tripnest.dto.TravelMemoryRequest;
import com.tripnest.dto.TravelMemoryResponse;
import com.tripnest.security.UserDetailsImpl;
import com.tripnest.service.TravelMemoryService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.TimeUnit;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/memories")
public class TravelMemoryController {

    @Autowired
    private TravelMemoryService travelMemoryService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createMemory(
            @RequestParam("photo") MultipartFile photo,
            @RequestParam("title") String title,
            @RequestParam(value = "caption", required = false) String caption,
            @RequestParam(value = "locationName", required = false) String locationName,
            @RequestParam(value = "tripId", required = false) Long tripId,
            @RequestParam(value = "destinationId", required = false) Long destinationId,
            @RequestParam(value = "visibility", required = false, defaultValue = "PRIVATE") String visibility) {
        try {
            Long userId = getCurrentUserId();
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new MessageResponse("Authentication required to create travel memories."));
            }

            TravelMemoryRequest request = new TravelMemoryRequest();
            request.setTitle(title);
            request.setCaption(caption);
            request.setLocationName(locationName);
            request.setTripId(tripId);
            request.setDestinationId(destinationId);
            request.setVisibility(visibility);

            TravelMemoryResponse response = travelMemoryService.createMemory(photo, request, userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new MessageResponse(e.getMessage()));
        } catch (SecurityException | AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse(e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Photo upload failure: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getUserMemories() {
        Long userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageResponse("Authentication required to view your memories."));
        }
        List<TravelMemoryResponse> list = travelMemoryService.getUserMemories(userId);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/public")
    public ResponseEntity<List<TravelMemoryResponse>> getPublicMemories() {
        Long userId = getCurrentUserId();
        List<TravelMemoryResponse> list = travelMemoryService.getPublicMemories(userId);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getMemoryById(@PathVariable Long id) {
        try {
            Long userId = getCurrentUserId();
            TravelMemoryResponse response = travelMemoryService.getMemoryById(id, userId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(e.getMessage()));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateMemory(
            @PathVariable Long id,
            @Valid @RequestBody TravelMemoryRequest request) {
        try {
            Long userId = getCurrentUserId();
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new MessageResponse("Authentication required."));
            }
            TravelMemoryResponse response = travelMemoryService.updateMemory(id, request, userId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new MessageResponse(e.getMessage()));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMemory(@PathVariable Long id) {
        try {
            Long userId = getCurrentUserId();
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new MessageResponse("Authentication required."));
            }
            travelMemoryService.deleteMemory(id, userId);
            return ResponseEntity.ok(new MessageResponse("Travel memory deleted successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(e.getMessage()));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse(e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to remove photo file: " + e.getMessage()));
        }
    }

    @GetMapping("/photo/{fileName}")
    public ResponseEntity<?> getPhoto(@PathVariable String fileName) {
        try {
            Long userId = getCurrentUserId();
            Resource resource = travelMemoryService.getMemoryPhotoResource(fileName, userId);
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            MediaType mediaType = MediaType.IMAGE_JPEG;
            String lower = fileName.toLowerCase();
            if (lower.endsWith(".png")) {
                mediaType = MediaType.IMAGE_PNG;
            } else if (lower.endsWith(".webp")) {
                mediaType = MediaType.parseMediaType("image/webp");
            }

            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .cacheControl(CacheControl.maxAge(1, TimeUnit.DAYS).cachePublic())
                    .body(resource);
        } catch (SecurityException | AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse(e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse("Resource not found"));
        }
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
            return ((UserDetailsImpl) authentication.getPrincipal()).getId();
        }
        return null;
    }
}
