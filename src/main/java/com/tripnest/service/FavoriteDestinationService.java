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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class FavoriteDestinationService {

    @Autowired
    private FavoriteDestinationRepository favoriteDestinationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DestinationRepository destinationRepository;

    @Transactional
    public FavoriteDestinationResponse addFavorite(FavoriteDestinationRequest request, Long userId) {
        if (request == null || request.getDestinationId() == null) {
            throw new IllegalArgumentException("Destination ID is required");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Destination destination = destinationRepository.findById(request.getDestinationId())
                .orElseThrow(() -> new ResourceNotFoundException("Destination not found with id: " + request.getDestinationId()));

        if (favoriteDestinationRepository.existsByUserIdAndDestinationId(userId, request.getDestinationId())) {
            throw new IllegalArgumentException("Destination already in favorites");
        }

        FavoriteDestination favorite = new FavoriteDestination();
        favorite.setUser(user);
        favorite.setDestination(destination);

        FavoriteDestination saved = favoriteDestinationRepository.save(favorite);
        return mapToResponse(saved);
    }

    public List<FavoriteDestinationResponse> getUserFavorites(Long userId) {
        List<FavoriteDestination> favorites = favoriteDestinationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return favorites.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void removeFavorite(Long destinationId, Long userId) {
        FavoriteDestination favorite = favoriteDestinationRepository.findByUserIdAndDestinationId(userId, destinationId)
                .orElseThrow(() -> new ResourceNotFoundException("Favorite destination not found for id: " + destinationId));

        favoriteDestinationRepository.delete(favorite);
    }

    private FavoriteDestinationResponse mapToResponse(FavoriteDestination favorite) {
        FavoriteDestinationResponse response = new FavoriteDestinationResponse();
        response.setId(favorite.getId());
        if (favorite.getDestination() != null) {
            response.setDestinationId(favorite.getDestination().getId());
            response.setDestinationName(favorite.getDestination().getName());
            response.setCountry(favorite.getDestination().getCountry());
            response.setState(favorite.getDestination().getState());
            response.setDescription(favorite.getDestination().getDescription());
            response.setImageUrl(favorite.getDestination().getImageUrl());
            response.setCategory(favorite.getDestination().getCategory());
            response.setBestSeason(favorite.getDestination().getBestSeason());
            response.setEstimatedBudget(favorite.getDestination().getEstimatedBudget());
            response.setRecommendedDays(favorite.getDestination().getRecommendedDays());
            response.setRating(favorite.getDestination().getRating());
        }
        response.setCreatedAt(favorite.getCreatedAt());
        return response;
    }
}
