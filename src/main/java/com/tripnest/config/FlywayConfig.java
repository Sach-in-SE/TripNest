package com.tripnest.config;

import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FlywayConfig {

    /**
     * Executes flyway.repair() before flyway.migrate().
     * This automatically reconciles any modified migration script checksums
     * in the flyway_schema_history table before executing pending migrations,
     * preventing FlywayValidateException during startup.
     */
    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            flyway.repair();
            flyway.migrate();
        };
    }
}
