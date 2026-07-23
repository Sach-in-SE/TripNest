package com.tripnest.service;

import com.tripnest.dto.FavoriteDestinationRequest;
import com.tripnest.dto.FavoriteDestinationResponse;
import com.tripnest.entity.Destination;
import com.tripnest.entity.FavoriteDestination;
import com.tripnest.entity.User;
import com.tripnest.repository.DestinationRepository;
import com.tripnest.repository.FavoriteDestinationRepository;
import com.tripnest.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FavoriteDestinationService {

    @Autowired
    private FavoriteDestinationRepository favoriteDestinationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DestinationRepository destinationRepository;

    public FavoriteDestinationResponse addFavorite(FavoriteDestinationRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Destination destination = destinationRepository.findById(request.getDestinationId())
                .orElseThrow(() -> new RuntimeException("Destination not found"));

        if (favoriteDestinationRepository.findByUserIdAndDestinationId(userId, request.getDestinationId()).isPresent()) {
            throw new RuntimeException("Destination already in favorites");
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

    public void removeFavorite(Long destinationId, Long userId) {
        FavoriteDestination favorite = favoriteDestinationRepository.findByUserIdAndDestinationId(userId, destinationId)
                .orElseThrow(() -> new RuntimeException("Favorite not found"));

        if (!favorite.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        favoriteDestinationRepository.delete(favorite);
    }

    private FavoriteDestinationResponse mapToResponse(FavoriteDestination favorite) {
        FavoriteDestinationResponse response = new FavoriteDestinationResponse();
        response.setId(favorite.getId());
        response.setDestinationId(favorite.getDestination().getId());
        response.setDestinationName(favorite.getDestination().getName());
        response.setCountry(favorite.getDestination().getCountry());
        response.setCity(favorite.getDestination().getCity());
        response.setDescription(favorite.getDestination().getDescription());
        response.setImageUrl(favorite.getDestination().getImageUrl());
        response.setClimate(favorite.getDestination().getClimate());
        response.setBestTimeToVisit(favorite.getDestination().getBestTimeToVisit());
        response.setAverageCost(favorite.getDestination().getAverageCost());
        response.setPopular(favorite.getDestination().isPopular());
        response.setCreatedAt(favorite.getCreatedAt());
        return response;
    }
}
