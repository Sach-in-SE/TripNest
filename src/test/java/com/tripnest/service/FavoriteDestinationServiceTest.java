package com.tripnest.service;

import com.tripnest.dto.FavoriteDestinationRequest;
import com.tripnest.dto.FavoriteDestinationResponse;
import com.tripnest.entity.Destination;
import com.tripnest.entity.FavoriteDestination;
import com.tripnest.entity.User;
import com.tripnest.exception.ResourceNotFoundException;
import com.tripnest.repository.DestinationRepository;
import com.tripnest.repository.FavoriteDestinationRepository;
import com.tripnest.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FavoriteDestinationServiceTest {

    @Mock
    private FavoriteDestinationRepository favoriteDestinationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private DestinationRepository destinationRepository;

    @InjectMocks
    private FavoriteDestinationService favoriteDestinationService;

    private User testUser;
    private Destination testDestination;
    private FavoriteDestination testFavorite;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(10L);
        testUser.setUsername("testuser");

        testDestination = new Destination();
        testDestination.setId(100L);
        testDestination.setName("Manali");
        testDestination.setCountry("India");
        testDestination.setState("Himachal Pradesh");
        testDestination.setDescription("Scenic hill station");
        testDestination.setCategory("Mountains");
        testDestination.setEstimatedBudget(15000.0);
        testDestination.setRecommendedDays(5);
        testDestination.setRating(4.8);

        testFavorite = new FavoriteDestination();
        testFavorite.setId(1L);
        testFavorite.setUser(testUser);
        testFavorite.setDestination(testDestination);
        testFavorite.setCreatedAt(LocalDateTime.now());
    }

    @Test
    @DisplayName("addFavorite: Success when user and destination exist and not already favorited")
    void addFavorite_Success() {
        FavoriteDestinationRequest request = new FavoriteDestinationRequest();
        request.setDestinationId(100L);

        when(userRepository.findById(10L)).thenReturn(Optional.of(testUser));
        when(destinationRepository.findById(100L)).thenReturn(Optional.of(testDestination));
        when(favoriteDestinationRepository.existsByUserIdAndDestinationId(10L, 100L)).thenReturn(false);
        when(favoriteDestinationRepository.save(any(FavoriteDestination.class))).thenReturn(testFavorite);

        FavoriteDestinationResponse response = favoriteDestinationService.addFavorite(request, 10L);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals(100L, response.getDestinationId());
        assertEquals("Manali", response.getDestinationName());
        assertEquals("Himachal Pradesh", response.getState());
        assertEquals("India", response.getCountry());
        assertEquals("Mountains", response.getCategory());
        assertEquals(4.8, response.getRating());
        verify(favoriteDestinationRepository, times(1)).save(any(FavoriteDestination.class));
    }

    @Test
    @DisplayName("addFavorite: Throws IllegalArgumentException when request or destinationId is null")
    void addFavorite_NullRequest_ThrowsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class, () -> favoriteDestinationService.addFavorite(null, 10L));

        FavoriteDestinationRequest emptyRequest = new FavoriteDestinationRequest();
        assertThrows(IllegalArgumentException.class, () -> favoriteDestinationService.addFavorite(emptyRequest, 10L));
    }

    @Test
    @DisplayName("addFavorite: Throws ResourceNotFoundException when user does not exist")
    void addFavorite_UserNotFound_ThrowsResourceNotFoundException() {
        FavoriteDestinationRequest request = new FavoriteDestinationRequest();
        request.setDestinationId(100L);

        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> favoriteDestinationService.addFavorite(request, 999L));
        verify(favoriteDestinationRepository, never()).save(any());
    }

    @Test
    @DisplayName("addFavorite: Throws ResourceNotFoundException when destination does not exist")
    void addFavorite_DestinationNotFound_ThrowsResourceNotFoundException() {
        FavoriteDestinationRequest request = new FavoriteDestinationRequest();
        request.setDestinationId(999L);

        when(userRepository.findById(10L)).thenReturn(Optional.of(testUser));
        when(destinationRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> favoriteDestinationService.addFavorite(request, 10L));
        verify(favoriteDestinationRepository, never()).save(any());
    }

    @Test
    @DisplayName("addFavorite: Throws IllegalArgumentException when already in favorites")
    void addFavorite_AlreadyInFavorites_ThrowsIllegalArgumentException() {
        FavoriteDestinationRequest request = new FavoriteDestinationRequest();
        request.setDestinationId(100L);

        when(userRepository.findById(10L)).thenReturn(Optional.of(testUser));
        when(destinationRepository.findById(100L)).thenReturn(Optional.of(testDestination));
        when(favoriteDestinationRepository.existsByUserIdAndDestinationId(10L, 100L)).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> favoriteDestinationService.addFavorite(request, 10L));
        assertEquals("Destination already in favorites", ex.getMessage());
        verify(favoriteDestinationRepository, never()).save(any());
    }

    @Test
    @DisplayName("getUserFavorites: Returns list of mapped FavoriteDestinationResponse")
    void getUserFavorites_Success() {
        when(favoriteDestinationRepository.findByUserIdOrderByCreatedAtDesc(10L))
                .thenReturn(List.of(testFavorite));

        List<FavoriteDestinationResponse> favorites = favoriteDestinationService.getUserFavorites(10L);

        assertNotNull(favorites);
        assertEquals(1, favorites.size());
        assertEquals("Manali", favorites.get(0).getDestinationName());
        assertEquals(100L, favorites.get(0).getDestinationId());
    }

    @Test
    @DisplayName("getUserFavorites: Returns empty list when user has no favorites")
    void getUserFavorites_EmptyList() {
        when(favoriteDestinationRepository.findByUserIdOrderByCreatedAtDesc(10L))
                .thenReturn(Collections.emptyList());

        List<FavoriteDestinationResponse> favorites = favoriteDestinationService.getUserFavorites(10L);

        assertNotNull(favorites);
        assertTrue(favorites.isEmpty());
    }

    @Test
    @DisplayName("removeFavorite: Success when favorite exists for user")
    void removeFavorite_Success() {
        when(favoriteDestinationRepository.findByUserIdAndDestinationId(10L, 100L))
                .thenReturn(Optional.of(testFavorite));

        assertDoesNotThrow(() -> favoriteDestinationService.removeFavorite(100L, 10L));
        verify(favoriteDestinationRepository, times(1)).delete(testFavorite);
    }

    @Test
    @DisplayName("removeFavorite: Throws ResourceNotFoundException when favorite does not exist")
    void removeFavorite_NotFound_ThrowsResourceNotFoundException() {
        when(favoriteDestinationRepository.findByUserIdAndDestinationId(10L, 999L))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> favoriteDestinationService.removeFavorite(999L, 10L));
        verify(favoriteDestinationRepository, never()).delete(any());
    }
}
