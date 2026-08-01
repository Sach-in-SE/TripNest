package com.tripnest.service;

import com.tripnest.dto.TravelPreferenceRequest;
import com.tripnest.dto.TravelPreferenceResponse;
import com.tripnest.entity.TravelPreference;
import com.tripnest.entity.User;
import com.tripnest.repository.TravelPreferenceRepository;
import com.tripnest.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.HashSet;
import java.util.Optional;

@Service
public class TravelPreferenceService {

    @Autowired
    private TravelPreferenceRepository travelPreferenceRepository;

    @Autowired
    private UserRepository userRepository;

    public TravelPreferenceResponse getPreferences(Long userId) {
        Optional<TravelPreference> preferenceOpt = travelPreferenceRepository.findByUserId(userId);
        if (preferenceOpt.isPresent()) {
            return mapToResponse(preferenceOpt.get());
        }
        return new TravelPreferenceResponse();
    }

    public TravelPreferenceResponse createOrUpdatePreferences(TravelPreferenceRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        TravelPreference preference = travelPreferenceRepository.findByUserId(userId)
                .orElse(new TravelPreference());

        preference.setUser(user);
        preference.setPreferredTripTypes(request.getPreferredTripTypes() != null ? request.getPreferredTripTypes() : new HashSet<>());
        preference.setPreferredBudgetRange(request.getPreferredBudgetRange());
        preference.setPreferredTravelStyle(request.getPreferredTravelStyle());

        TravelPreference saved = travelPreferenceRepository.save(preference);
        return mapToResponse(saved);
    }

    private TravelPreferenceResponse mapToResponse(TravelPreference preference) {
        TravelPreferenceResponse response = new TravelPreferenceResponse();
        response.setId(preference.getId());
        response.setPreferredTripTypes(preference.getPreferredTripTypes());
        response.setPreferredBudgetRange(preference.getPreferredBudgetRange());
        response.setPreferredTravelStyle(preference.getPreferredTravelStyle());
        response.setCreatedAt(preference.getCreatedAt());
        response.setUpdatedAt(preference.getUpdatedAt());
        return response;
    }
}
