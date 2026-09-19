package com.tripnest.controller;

import com.tripnest.dto.AdminUserRoleRequest;
import com.tripnest.dto.AdminUserResponse;
import com.tripnest.dto.AdminUserStatusRequest;
import com.tripnest.dto.MessageResponse;
import com.tripnest.exception.ResourceNotFoundException;
import com.tripnest.security.UserDetailsImpl;
import com.tripnest.service.AdminUserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    @Autowired
    private AdminUserService adminUserService;

    @GetMapping
    public ResponseEntity<?> getUsers(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "enabled", required = false) Boolean enabled,
            @RequestParam(value = "role", required = false) String role,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "size", required = false) Integer size) {
        if (page != null) {
            int boundedSize = Math.max(1, Math.min(size != null ? size : 20, 100));
            int boundedPage = Math.max(0, page);
            org.springframework.data.domain.Page<AdminUserResponse> result =
                    adminUserService.getUsers(search, enabled, role, org.springframework.data.domain.PageRequest.of(boundedPage, boundedSize));
            return ResponseEntity.ok(result);
        }
        List<AdminUserResponse> users = adminUserService.getUsers(search, enabled, role);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        try {
            AdminUserResponse user = adminUserService.getUserById(id);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody AdminUserStatusRequest request) {
        try {
            Long currentAdminId = getCurrentUserId();
            AdminUserResponse response = adminUserService.updateUserStatus(id, request.getEnabled(), currentAdminId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(e.getMessage()));
        }
    }

    @PutMapping("/{id}/roles")
    public ResponseEntity<?> updateUserRoles(
            @PathVariable Long id,
            @Valid @RequestBody AdminUserRoleRequest request) {
        try {
            Long currentAdminId = getCurrentUserId();
            AdminUserResponse response = adminUserService.updateUserRoles(id, request.getRoles(), currentAdminId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/{id}/reset-password")
    public ResponseEntity<?> resetUserPassword(@PathVariable Long id) {
        try {
            com.tripnest.dto.AdminResetPasswordResponse response = adminUserService.generateTemporaryPassword(id);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            Long currentAdminId = getCurrentUserId();
            adminUserService.deleteUser(id, currentAdminId);
            return ResponseEntity.ok(new MessageResponse("User deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(e.getMessage()));
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
