package com.tripnest.component;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DestinationDataSeeder implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DestinationDataSeeder.class);

    @Override
    public void run(String... args) throws Exception {
        logger.info("TripNest Destination module running in dynamic admin-managed mode (zero seed dependencies).");
    }
}
