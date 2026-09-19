package com.tripnest.database;

import com.tripnest.entity.*;
import com.tripnest.repository.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(classes = com.tripnest.tripnest.TripnestApplication.class)
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:postgres_parity_db;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH",
    "spring.datasource.driverClassName=org.h2.Driver",
    "spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect",
    "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect",
    "spring.jpa.hibernate.ddl-auto=validate",
    "spring.sql.init.mode=always",
    "spring.sql.init.schema-locations=file:schema-postgres.sql",
    "spring.sql.init.data-locations=",
    "spring.flyway.enabled=false"
})
public class PostgresSchemaParityTest {

    @Autowired
    private DataSource dataSource;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private DestinationRepository destinationRepository;

    @Autowired
    private BudgetRepository budgetRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private ItineraryRepository itineraryRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private TravelMemoryRepository travelMemoryRepository;

    @Autowired
    private TravelMemoryImageRepository travelMemoryImageRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private GroupMemberRepository groupMemberRepository;

    @Autowired
    private GroupMessageRepository groupMessageRepository;

    @Autowired
    private ContactMessageRepository contactMessageRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private NotificationPreferenceRepository notificationPreferenceRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    @DisplayName("PostgreSQL Parity: Schema initialization and ddl-auto=validate success")
    void testSchemaValidationAndRoles() {
        assertNotNull(dataSource, "DataSource should be initialized");
        List<Role> roles = roleRepository.findAll();
        assertFalse(roles.isEmpty(), "Roles should be seeded by schema-postgres.sql");
        assertTrue(roles.stream().anyMatch(r -> r.getName() == ERole.ROLE_ADMIN));
        assertTrue(roles.stream().anyMatch(r -> r.getName() == ERole.ROLE_TRAVELER));
    }

    @Test
    @Transactional
    @DisplayName("PostgreSQL Parity: User creation and authentication entity mappings")
    void testUserAndAuthFlow() {
        String uniqueSuffix = String.valueOf(System.nanoTime());
        User user = new User();
        user.setUsername("pguser_" + uniqueSuffix);
        user.setEmail("pguser_" + uniqueSuffix + "@tripnest.test");
        user.setPassword(passwordEncoder.encode("SecurePass2026!"));
        user.setFirstName("Postgres");
        user.setLastName("Tester");
        user.setEnabled(true);
        user.setEmailVerified(true);
        user.setProvider(AuthProvider.LOCAL);

        Role travelerRole = roleRepository.findByName(ERole.ROLE_TRAVELER).orElseThrow();
        user.setRoles(Set.of(travelerRole));

        User saved = userRepository.save(user);
        assertNotNull(saved.getId());

        User fetched = userRepository.findByUsername("pguser_" + uniqueSuffix).orElseThrow();
        assertEquals(user.getEmail(), fetched.getEmail());
        assertTrue(passwordEncoder.matches("SecurePass2026!", fetched.getPassword()));
        assertEquals(1, fetched.getRoles().size());
    }

    @Test
    @Transactional
    @DisplayName("PostgreSQL Parity: Trips, Itineraries, and Activities mapping")
    void testTripAndItineraryFlow() {
        User user = createTestUser("trip_owner");
        Trip trip = new Trip();
        trip.setTitle("Himalayan Odyssey");
        trip.setDescription("Mountain trekking and exploration");
        trip.setDestination("Manali");
        trip.setStartDate(LocalDate.now().plusDays(10));
        trip.setEndDate(LocalDate.now().plusDays(17));
        trip.setNumberOfTravelers(4);
        trip.setBudget(75000.0);
        trip.setStatus(TripStatus.PLANNING);
        trip.setUser(user);
        trip.setReminder7DaySent(false);
        trip.setReminder3DaySent(false);
        trip.setReminder24HourSent(false);
        trip.setTripStartedSent(false);
        trip.setTripCompletedSent(false);
        Trip savedTrip = tripRepository.save(trip);
        assertNotNull(savedTrip.getId());

        Itinerary itinerary = new Itinerary();
        itinerary.setTrip(savedTrip);
        itinerary.setUser(user);
        itinerary.setDate(LocalDate.now().plusDays(11));
        itinerary.setNotes("Solang valley visit");
        Itinerary savedItinerary = itineraryRepository.save(itinerary);
        assertNotNull(savedItinerary.getId());

        Activity activity = new Activity();
        activity.setTitle("Paragliding");
        activity.setDescription("Tandem flight in Solang");
        activity.setStartTime(LocalTime.of(10, 0));
        activity.setEndTime(LocalTime.of(11, 30));
        activity.setLocation("Solang Valley");
        activity.setType(ActivityType.ADVENTURE);
        activity.setCost(3500.0);
        activity.setReminder(ActivityReminder.ONE_HOUR);
        activity.setReminderSent(false);
        activity.setItinerary(savedItinerary);
        activity.setUser(user);
        Activity savedActivity = activityRepository.save(activity);
        assertNotNull(savedActivity.getId());

        List<Trip> userTrips = tripRepository.findByUserId(user.getId());
        assertEquals(1, userTrips.size());
    }

    @Test
    @Transactional
    @DisplayName("PostgreSQL Parity: Budgets, Expenses and Aggregate Queries")
    void testBudgetAndExpenseFlow() {
        User user = createTestUser("budget_user");
        Trip trip = createTestTrip(user, "Kerala Backwaters");

        Budget budget = new Budget();
        budget.setTrip(trip);
        budget.setTotalAmount(40000.0);
        budget.setSpentAmount(5000.0);
        budget.setCurrency("INR");
        budget.setAlert80Sent(false);
        budget.setAlert100Sent(false);
        Budget savedBudget = budgetRepository.save(budget);
        assertNotNull(savedBudget.getId());

        Expense expense = new Expense();
        expense.setTitle("Houseboat Rental");
        expense.setAmount(5000.0);
        expense.setCategory(ExpenseCategory.HOTEL);
        expense.setDate(LocalDate.now());
        expense.setDescription("Alleppey night stay");
        expense.setTrip(trip);
        expense.setUser(user);
        Expense savedExpense = expenseRepository.save(expense);
        assertNotNull(savedExpense.getId());

        Double totalTripExpense = expenseRepository.getTotalExpenseByTripId(trip.getId());
        assertEquals(5000.0, totalTripExpense);
    }

    @Test
    @Transactional
    @DisplayName("PostgreSQL Parity: Destinations and Boolean popular columnDefinition")
    void testDestinationFlow() {
        String uniqueName = "Dest_" + System.nanoTime();
        Destination dest = new Destination();
        dest.setName(uniqueName);
        dest.setState("Rajasthan");
        dest.setCountry("India");
        dest.setDescription("Forts and heritage");
        dest.setCategory("Historical");
        dest.setEstimatedBudget(25000.0);
        dest.setRecommendedDays(4);
        dest.setLatitude(26.9124);
        dest.setLongitude(75.7873);
        dest.setRating(4.8);
        dest.setPopular(true);
        Destination saved = destinationRepository.save(dest);
        assertNotNull(saved.getId());
        assertTrue(saved.getPopular());

        List<Destination> destinations = destinationRepository.findAll();
        assertTrue(destinations.stream().anyMatch(d -> d.getId().equals(saved.getId()) && Boolean.TRUE.equals(d.getPopular())));
    }

    @Test
    @Transactional
    @DisplayName("PostgreSQL Parity: Multi-Image Travel Memories cascade and retrieval")
    void testTravelMemoriesMultiImageFlow() {
        User user = createTestUser("memory_creator");
        Destination dest = createTestDestination("Memory Dest");

        TravelMemory memory = new TravelMemory();
        memory.setTitle("Taj Mahal Sunrise");
        memory.setCaption("Unforgettable dawn at the monument of love");
        memory.setLocationName("Agra");
        memory.setVisibility(MemoryVisibility.PUBLIC);
        memory.setDestination(dest);
        memory.setUser(user);

        TravelMemoryImage img1 = new TravelMemoryImage();
        img1.setTravelMemory(memory);
        img1.setStoredFileName("uuid-img-1.jpg");
        img1.setFileUrl("/api/memories/photo/uuid-img-1.jpg");
        img1.setOriginalFileName("sunrise1.jpg");
        img1.setContentType("image/jpeg");
        img1.setFileSize(204800L);
        img1.setDisplayOrder(0);

        TravelMemoryImage img2 = new TravelMemoryImage();
        img2.setTravelMemory(memory);
        img2.setStoredFileName("uuid-img-2.jpg");
        img2.setFileUrl("/api/memories/photo/uuid-img-2.jpg");
        img2.setOriginalFileName("sunrise2.jpg");
        img2.setContentType("image/jpeg");
        img2.setFileSize(307200L);
        img2.setDisplayOrder(1);

        memory.getImages().add(img1);
        memory.getImages().add(img2);

        TravelMemory savedMemory = travelMemoryRepository.save(memory);
        assertNotNull(savedMemory.getId());
        assertEquals(2, savedMemory.getImages().size());

        List<TravelMemory> publicMemories = travelMemoryRepository.findByVisibilityOrderByCreatedAtDesc(MemoryVisibility.PUBLIC);
        assertTrue(publicMemories.stream().anyMatch(m -> m.getId().equals(savedMemory.getId())));
    }

    @Test
    @Transactional
    @DisplayName("PostgreSQL Parity: Documents persistence and metadata")
    void testDocumentFlow() {
        User user = createTestUser("doc_user");
        Trip trip = createTestTrip(user, "Europe Tour");

        TravelDocument doc = new TravelDocument();
        doc.setFileName("flight_ticket.pdf");
        doc.setFileType("application/pdf");
        doc.setFileUrl("/api/documents/download/flight_ticket.pdf");
        doc.setDocumentType(DocumentType.TICKET);
        doc.setTrip(trip);
        doc.setUser(user);

        TravelDocument savedDoc = documentRepository.save(doc);
        assertNotNull(savedDoc.getId());

        List<TravelDocument> tripDocs = documentRepository.findByTripId(trip.getId());
        assertEquals(1, tripDocs.size());
        assertEquals(DocumentType.TICKET, tripDocs.get(0).getDocumentType());
    }

    @Test
    @Transactional
    @DisplayName("PostgreSQL Parity: Groups, Memberships, and Chat messages")
    void testGroupAndChatFlow() {
        User creator = createTestUser("group_creator");
        User member = createTestUser("group_member");

        TravelGroup group = new TravelGroup();
        group.setName("Weekend Adventurers");
        group.setDescription("Local trekking group");
        group.setCreatedBy(creator);
        group.getMembers().add(creator);
        group.getMembers().add(member);
        TravelGroup savedGroup = groupRepository.save(group);
        assertNotNull(savedGroup.getId());

        GroupMember membership = new GroupMember();
        membership.setTravelGroup(savedGroup);
        membership.setUser(member);
        membership.setInvitedBy(creator);
        membership.setRole(GroupRole.MEMBER);
        membership.setStatus(GroupInvitationStatus.ACCEPTED);
        membership.setTripPermission(SharePermission.VIEW);
        membership.setInvitedAt(LocalDateTime.now().minusDays(1));
        membership.setJoinedAt(LocalDateTime.now());
        GroupMember savedMembership = groupMemberRepository.save(membership);
        assertNotNull(savedMembership.getId());

        GroupMessage msg = new GroupMessage();
        msg.setTravelGroup(savedGroup);
        msg.setSender(member);
        msg.setContent("Excited for the upcoming trek!");
        GroupMessage savedMsg = groupMessageRepository.save(msg);
        assertNotNull(savedMsg.getId());

        List<GroupMessage> messages = groupMessageRepository.findByTravelGroupIdOrderByCreatedAtAsc(savedGroup.getId());
        assertEquals(1, messages.size());
        assertEquals("Excited for the upcoming trek!", messages.get(0).getContent());
    }

    @Test
    @Transactional
    @DisplayName("PostgreSQL Parity: Contact messages and Notifications")
    void testNotificationAndContactFlow() {
        User user = createTestUser("contact_user");

        ContactMessage contact = new ContactMessage();
        contact.setName("Priya Sharma");
        contact.setEmail("priya@tripnest.test");
        contact.setCategory(ContactCategory.FEEDBACK);
        contact.setSubject("Great Platform");
        contact.setMessage("Really loved the multi-image memory gallery feature.");
        contact.setStatus(ContactMessageStatus.NEW);
        contact.setUser(user);
        ContactMessage savedContact = contactMessageRepository.save(contact);
        assertNotNull(savedContact.getId());

        Notification notif = new Notification();
        notif.setTitle("Trip Update");
        notif.setMessage("Itinerary updated for your upcoming trip.");
        notif.setType(NotificationType.TRAVEL_UPDATE);
        notif.setUser(user);
        notif.setRead(false);
        Notification savedNotif = notificationRepository.save(notif);
        assertNotNull(savedNotif.getId());

        long unreadCount = notificationRepository.countByUserIdAndIsReadFalse(user.getId());
        assertEquals(1, unreadCount);
    }

    // Helper methods
    private User createTestUser(String prefix) {
        String suffix = String.valueOf(System.nanoTime());
        User u = new User();
        u.setUsername(prefix + "_" + suffix);
        u.setEmail(prefix + "_" + suffix + "@test.com");
        u.setPassword(passwordEncoder.encode("Secret123!"));
        u.setEnabled(true);
        return userRepository.save(u);
    }

    private Trip createTestTrip(User user, String destination) {
        Trip t = new Trip();
        t.setTitle("Trip to " + destination);
        t.setDestination(destination);
        t.setUser(user);
        t.setStatus(TripStatus.PLANNING);
        return tripRepository.save(t);
    }

    private Destination createTestDestination(String name) {
        Destination d = new Destination();
        d.setName(name + "_" + System.nanoTime());
        d.setState("TestState");
        d.setCountry("TestCountry");
        d.setPopular(false);
        return destinationRepository.save(d);
    }
}
