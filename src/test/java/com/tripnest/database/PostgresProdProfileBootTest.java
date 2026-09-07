package com.tripnest.database;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(
    classes = com.tripnest.tripnest.TripnestApplication.class,
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT
)
@ActiveProfiles("prod")
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:postgres_prod_test_db;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH",
    "spring.datasource.driverClassName=org.h2.Driver",
    "spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect",
    "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect",
    "spring.jpa.hibernate.ddl-auto=validate",
    "spring.sql.init.mode=always",
    "spring.sql.init.schema-locations=file:schema-postgres.sql",
    "spring.sql.init.data-locations=",
    "tripnest.admin.password=ProdSecurePassword2026!",
    "tripnest.app.jwtSecret=ProductionSecureCryptographicallyRandomKey2026VeryLongString32Plus"
})
public class PostgresProdProfileBootTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private org.springframework.core.env.Environment environment;

    @Test
    @DisplayName("Production Profile + PostgreSQL + ddl-auto=validate + Actuator Health Check")
    void testProductionProfileStartupAndHealth() {
        ResponseEntity<String> response = restTemplate.getForEntity(
            "http://localhost:" + port + "/actuator/health",
            String.class
        );
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().contains("UP"));
    }

    @Test
    @DisplayName("Production Profile: Forwarded headers, graceful shutdown, and HikariCP defaults")
    void testProductionProfileConfigurations() {
        // Forwarded headers strategy for Azure Container Apps / reverse proxy SSL termination
        assertEquals("native", environment.getProperty("server.forward-headers-strategy"));

        // Graceful shutdown configuration
        assertEquals("graceful", environment.getProperty("server.shutdown"));
        assertEquals("20s", environment.getProperty("spring.lifecycle.timeout-per-shutdown-phase"));

        // HikariCP connection pool settings
        assertEquals("10", environment.getProperty("spring.datasource.hikari.maximum-pool-size"));
        assertEquals("3", environment.getProperty("spring.datasource.hikari.minimum-idle"));
        assertEquals("20000", environment.getProperty("spring.datasource.hikari.connection-timeout"));

        // Frontend URL and CORS defaults
        assertEquals("http://localhost", environment.getProperty("app.frontend.url"));
        assertEquals("http://localhost", environment.getProperty("tripnest.cors.allowed-origins"));
    }
}
