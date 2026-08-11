package com.tripnest.component;

import com.tripnest.entity.Destination;
import com.tripnest.repository.DestinationRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(classes = com.tripnest.tripnest.TripnestApplication.class)
class DestinationSeederIntegrationTest {

    @Autowired
    private DestinationRepository destinationRepository;

    @Autowired
    private DestinationDataSeeder destinationDataSeeder;

    @Test
    void datasetSeeding_CreatesExactly35DestinationsWithAllFieldsPopulated() {
        List<Destination> all = destinationRepository.findAll();
        assertEquals(35, all.size(), "Expected exactly 35 seeded destinations, found: " + all.size());

        for (Destination dest : all) {
            assertNotNull(dest.getName(), "Name must not be null for id " + dest.getId());
            assertFalse(dest.getName().trim().isEmpty());
            assertNotNull(dest.getState(), "State must not be null for " + dest.getName());
            assertNotNull(dest.getCountry(), "Country must not be null for " + dest.getName());
            assertNotNull(dest.getCategory(), "Category must not be null for " + dest.getName());
            assertNotEquals("Travel", dest.getCategory(), "Category must not be 'Travel' for " + dest.getName());
            assertNotNull(dest.getDescription(), "Description must not be null for " + dest.getName());
            assertNotNull(dest.getImageUrl(), "ImageUrl must not be null for " + dest.getName());
            assertTrue(dest.getImageUrl().startsWith("http://") || dest.getImageUrl().startsWith("https://"),
                    "ImageUrl must be valid HTTP/HTTPS for " + dest.getName());
            assertNotNull(dest.getBestSeason(), "BestSeason must not be null for " + dest.getName());
            assertNotNull(dest.getEstimatedBudget(), "EstimatedBudget must not be null for " + dest.getName());
            assertTrue(dest.getEstimatedBudget() > 0, "Budget must be positive for " + dest.getName());
            assertNotNull(dest.getRecommendedDays(), "RecommendedDays must not be null for " + dest.getName());
            assertTrue(dest.getRecommendedDays() > 0, "RecommendedDays must be positive for " + dest.getName());
            assertNotNull(dest.getLatitude(), "Latitude must not be null for " + dest.getName());
            assertNotNull(dest.getLongitude(), "Longitude must not be null for " + dest.getName());
            assertNotNull(dest.getRating(), "Rating must not be null for " + dest.getName());
        }
    }

    @Test
    void datasetSeeding_EveryCategoryHasExactly5Destinations() {
        String[] categories = {"Beach", "Mountains", "Historical", "Adventure", "Spiritual", "Wildlife", "City"};

        for (String cat : categories) {
            List<Destination> list = destinationRepository.findByCategoryIgnoreCase(cat);
            assertEquals(5, list.size(), "Category '" + cat + "' must have exactly 5 destinations, found: " + list.size());
        }
    }

    @Test
    void datasetSeeding_IsIdempotentOnMultipleRuns() throws Exception {
        destinationDataSeeder.run();
        destinationDataSeeder.run();

        assertEquals(35, destinationRepository.count(), "Total destinations in DB must remain exactly 35 after multiple seeder runs");
    }
}
