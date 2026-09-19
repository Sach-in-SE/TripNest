package com.tripnest.database;

import com.tripnest.entity.*;
import com.tripnest.repository.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@Testcontainers(disabledWithoutDocker = true)
@SpringBootTest(
    classes = com.tripnest.tripnest.TripnestApplication.class,
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT
)
@ActiveProfiles("prod")
public class PostgresContainerIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("tripnest_test_db")
            .withUsername("test_user")
            .withPassword("test_password");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
        registry.add("spring.jpa.properties.hibernate.dialect", () -> "org.hibernate.dialect.PostgreSQLDialect");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
        registry.add("spring.flyway.enabled", () -> "true");
        registry.add("spring.flyway.locations", () -> "classpath:db/migration");
        registry.add("spring.flyway.baseline-on-migrate", () -> "true");
        registry.add("spring.datasource.hikari.data-source-properties.sslmode", () -> "disable");
        registry.add("tripnest.admin.password", () -> "ProdSecurePassword2026!");
        registry.add("tripnest.app.jwtSecret", () -> "ProductionSecureCryptographicallyRandomKey2026VeryLongString32Plus");
    }

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private DataSource dataSource;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private DestinationRepository destinationRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private BudgetRepository budgetRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private TravelMemoryRepository travelMemoryRepository;

    @Autowired
    private TravelMemoryImageRepository travelMemoryImageRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private org.springframework.core.env.Environment environment;

    @Test
    @DisplayName("1. Real PostgreSQL: Flyway creates schema & history table on fresh database")
    void testFlywaySchemaHistoryAndFreshDbStartup() throws Exception {
        assertNotNull(dataSource, "DataSource must be initialized");
        try (Connection connection = dataSource.getConnection();
             Statement stmt = connection.createStatement()) {
            ResultSet rs = stmt.executeQuery("SELECT version, description, success FROM flyway_schema_history");
            assertTrue(rs.next(), "Flyway schema history record should exist");
            assertEquals("1", rs.getString("version"));
            assertEquals("initial schema", rs.getString("description"));
            assertTrue(rs.getBoolean("success"), "Flyway V1 migration must be successful");
        }
    }

    @Test
    @DisplayName("2. Real PostgreSQL: Roles seeded by Flyway migration exist in PostgreSQL")
    void testRolesSeededByMigration() {
        List<Role> roles = roleRepository.findAll();
        assertFalse(roles.isEmpty(), "Roles should be seeded by Flyway migration");
        assertTrue(roles.stream().anyMatch(r -> r.getName() == ERole.ROLE_ADMIN));
        assertTrue(roles.stream().anyMatch(r -> r.getName() == ERole.ROLE_TRAVELER));
        assertTrue(roles.stream().anyMatch(r -> r.getName() == ERole.ROLE_GROUP_ADMIN));
        assertTrue(roles.stream().anyMatch(r -> r.getName() == ERole.ROLE_USER));
    }

    @Test
    @DisplayName("3. Real PostgreSQL: Actuator health check returns UP against PostgreSQL container")
    void testActuatorHealthCheckWithPostgres() {
        ResponseEntity<String> response = restTemplate.getForEntity(
                "http://localhost:" + port + "/actuator/health",
                String.class
        );
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().contains("UP"), "Actuator health must report UP with PostgreSQL");
    }

    @Test
    @DisplayName("4. Real PostgreSQL: Entity CRUD across tables validated against PostgreSQL container")
    void testEntityLifecycleOnRealPostgres() {
        Role travelerRole = roleRepository.findByName(ERole.ROLE_TRAVELER)
                .orElseThrow(() -> new IllegalStateException("ROLE_TRAVELER missing"));

        User user = new User();
        user.setUsername("postgres_test_traveler");
        user.setEmail("pg_traveler@example.com");
        user.setPassword(passwordEncoder.encode("SecurePass123!"));
        user.setFirstName("Postgres");
        user.setLastName("User");
        user.setEnabled(true);
        user.setEmailVerified(true);
        user.setProvider(AuthProvider.LOCAL);
        user.setRoles(Set.of(travelerRole));
        User savedUser = userRepository.save(user);
        assertNotNull(savedUser.getId(), "User ID should be generated by PostgreSQL identity column");

        Destination destination = new Destination();
        destination.setName("Swiss Alps");
        destination.setState("Valais");
        destination.setCountry("Switzerland");
        destination.setDescription("Scenic mountain peaks and lakes");
        Destination savedDestination = destinationRepository.save(destination);
        assertNotNull(savedDestination.getId());

        Trip trip = new Trip();
        trip.setTitle("Alps Adventure");
        trip.setDescription("Hiking the Swiss trails");
        trip.setDestination(savedDestination.getName());
        trip.setStartDate(LocalDate.now().plusDays(10));
        trip.setEndDate(LocalDate.now().plusDays(20));
        trip.setNumberOfTravelers(2);
        trip.setBudget(5000.0);
        trip.setStatus(TripStatus.PLANNING);
        trip.setUser(savedUser);
        Trip savedTrip = tripRepository.save(trip);
        assertNotNull(savedTrip.getId());

        Budget budget = new Budget();
        budget.setTrip(savedTrip);
        budget.setTotalAmount(5000.0);
        budget.setSpentAmount(350.0);
        budget.setCurrency("USD");
        Budget savedBudget = budgetRepository.save(budget);
        assertNotNull(savedBudget.getId());

        Expense expense = new Expense();
        expense.setTitle("Train Pass");
        expense.setAmount(350.0);
        expense.setCategory(ExpenseCategory.TRANSPORTATION);
        expense.setDate(LocalDate.now().plusDays(11));
        expense.setTrip(savedTrip);
        expense.setUser(savedUser);
        Expense savedExpense = expenseRepository.save(expense);
        assertNotNull(savedExpense.getId());

        TravelMemory memory = new TravelMemory();
        memory.setUser(savedUser);
        memory.setTitle("Summit View");
        memory.setCaption("View from the top");
        memory.setLocationName("Zermatt");
        memory.setVisibility(MemoryVisibility.PUBLIC);
        memory.setCreatedAt(LocalDateTime.now());
        TravelMemory savedMemory = travelMemoryRepository.save(memory);
        assertNotNull(savedMemory.getId());

        TravelMemoryImage memoryImage = new TravelMemoryImage();
        memoryImage.setTravelMemory(savedMemory);
        memoryImage.setStoredFileName("summit.jpg");
        memoryImage.setFileUrl("/api/memories/photo/summit.jpg");
        memoryImage.setOriginalFileName("summit.jpg");
        memoryImage.setContentType("image/jpeg");
        memoryImage.setFileSize(1024L);
        memoryImage.setDisplayOrder(0);
        TravelMemoryImage savedImage = travelMemoryImageRepository.save(memoryImage);
        assertNotNull(savedImage.getId());
    }

    @Test
    @DisplayName("5. Real PostgreSQL: Unique constraint violation triggers DataIntegrityViolationException")
    void testDataIntegrityViolationOnPostgres() {
        Role travelerRole = roleRepository.findByName(ERole.ROLE_TRAVELER).orElse(null);

        User user1 = new User();
        user1.setUsername("unique_conflict_user");
        user1.setEmail("conflict_test@example.com");
        user1.setPassword(passwordEncoder.encode("Pass123!"));
        user1.setEnabled(true);
        user1.setProvider(AuthProvider.LOCAL);
        if (travelerRole != null) {
            user1.setRoles(Set.of(travelerRole));
        }
        userRepository.saveAndFlush(user1);

        // Attempt duplicate username insert against real PostgreSQL table
        User user2 = new User();
        user2.setUsername("unique_conflict_user");
        user2.setEmail("different_email@example.com");
        user2.setPassword(passwordEncoder.encode("Pass123!"));
        user2.setEnabled(true);
        user2.setProvider(AuthProvider.LOCAL);
        if (travelerRole != null) {
            user2.setRoles(Set.of(travelerRole));
        }

        assertThrows(DataIntegrityViolationException.class, () -> {
            userRepository.saveAndFlush(user2);
        }, "Inserting duplicate username must throw DataIntegrityViolationException on PostgreSQL");
    }

    @Test
    @DisplayName("6. Real PostgreSQL: Production timeout & pool properties active in container environment")
    void testProductionConfigurationsInPostgresEnvironment() {
        assertEquals("10000", environment.getProperty("spring.datasource.hikari.leak-detection-threshold"));
        assertEquals("15000", environment.getProperty("spring.jpa.properties.jakarta.persistence.query.timeout"));
        assertEquals("30", environment.getProperty("spring.datasource.hikari.data-source-properties.socketTimeout"));
        assertEquals("disable", environment.getProperty("spring.datasource.hikari.data-source-properties.sslmode"));
    }
}
