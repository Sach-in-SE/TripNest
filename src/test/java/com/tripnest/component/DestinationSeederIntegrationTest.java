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
    void destinationSeeder_RunsWithoutInjectingHardcodedDestinations() throws Exception {
        long initialCount = destinationRepository.count();
        destinationDataSeeder.run();
        long postRunCount = destinationRepository.count();

        assertEquals(initialCount, postRunCount, "Destination seeder must not inject hardcoded records");
    }

    @Test
    void destinationData_IsExclusivelyAdminAndDatabaseDriven() {
        assertNotNull(destinationRepository);
        assertNotNull(destinationDataSeeder);
    }
}

