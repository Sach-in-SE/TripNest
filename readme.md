# 🧳 TripNest — Travel Planning & Trip Management Platform

TripNest is a full-stack travel planning platform that helps users create trips, build day-wise itineraries, track budgets and expenses, collaborate with friends/family on shared trips, discover destinations, manage travel documents, and stay updated through in-app notifications — all from a single dashboard.

Built as part of **Infosys Springboard Internship 7.0**.

---

## 🚀 Tech Stack

**Backend**
- Java 17 + Spring Boot 3.5.16 + Maven
- Spring Security 6.x + Stateless JWT Authentication (`jjwt` 0.11.5)
- OAuth2 (Google Login)
- Spring Data JPA + Hibernate
- MySQL (local development)

**Frontend**
- React 18 + Vite
- Axios (with JWT auto-attach interceptor)
- React Router
- React Context API for auth state

**Other**
- `.env` based secret management (`spring-dotenv`)
- Local file storage for document/photo uploads

---

## ✨ Features Implemented So Far

### Milestone 1 — Authentication & Users
- JWT-based signup/login
- OAuth2 Google Sign-In
- Password reset flow (token-based)
- Role-based access (Traveler / Group Admin / Administrator)
- Profile management

### Milestone 2 — Trip & Itinerary Management
- Create / edit / delete / view trips
- Day-wise itinerary planning with activities (Sightseeing, Transportation, Accommodation, Dining, Adventure, Shopping, Other)
- Destination browsing (global catalog)
- **Trip Sharing** — share a trip with another user by email with VIEW or EDIT permission, invite-accept/decline flow with notifications, shared users get scoped access across Itinerary/Activities/Budget/Expenses/Documents when granted EDIT

### Milestone 3 — Budget, Collaboration & Documents
- Budget planning + category-wise expense tracking (Transportation, Hotel, Food, Shopping, Entertainment, Miscellaneous)
- Group collaboration (create travel groups, add members)
- In-app notification system (create, mark read, mark all read, delete, unread count)
- Document upload system (tickets, hotel bookings, photos, visas, insurance — stored locally, served with correct MIME type)

### 🔜 Not Yet Implemented (Planned)
- Travel preferences / favorite destinations / travel history on profile
- Attractions listing, travel guides, live weather on destination pages
- Group discussions & shared expense splitting, in-group roles
- Automated reminder engine (trip/activity reminders, budget alerts)
- Analytics dashboards (traveler + admin), reporting charts
- Cloud storage for documents (currently local disk)
- Testing suite, Docker, production deployment (Milestone 4)

---

## 📁 Project Structure

```
TripNest/
└── tripnest/                          # Spring Boot backend root
    ├── src/main/java/com/tripnest/
    │   ├── entity/                    # JPA entities
    │   ├── repository/                # Spring Data JPA repositories
    │   ├── dto/                       # Request/Response DTOs
    │   ├── service/                   # Business logic
    │   ├── controller/                # REST controllers
    │   ├── security/                  # JWT filter, entry point, OAuth2 handlers
    │   └── config/                    # Misc Spring config (PasswordEncoder, etc.)
    ├── src/main/resources/
    │   └── application.properties
    ├── .env                           # Local secrets (gitignored) — see Setup below
    ├── pom.xml
    └── frontend/                      # React (Vite) frontend
        └── src/
            ├── pages/
            ├── components/
            ├── services/              # api.js, authService.js, tripService.js
            └── context/               # AuthContext.jsx
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Java 17+
- Node.js 18+ and npm
- MySQL 8+/9.x running locally
- Maven (or use the included `mvnw`/`mvnw.cmd` wrapper)

### 1. Clone the repository
```bash
git clone https://github.com/Sach-in-SE/TripNest.git
cd TripNest/tripnest
```

### 2. Database setup
Create a MySQL database:
```sql
CREATE DATABASE tripnest_db;
```
Update `src/main/resources/application.properties` with your MySQL username/password if different from defaults.

### 3. Configure environment secrets
Create a `.env` file in the `tripnest/` folder (same level as `pom.xml`) — **this file is gitignored and must be created manually by each developer**:
```env
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
```
> Get these from [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → OAuth Client ID (Web application). Add `http://localhost:8080/login/oauth2/code/google` as an authorized redirect URI.

### 4. Run the backend
```bash
./mvnw clean compile
./mvnw spring-boot:run
```
Backend runs on **http://localhost:8080**

### 5. Run the frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on **http://localhost:5173**

---

## 🔑 Key API Endpoints

| Module | Base Path | Auth Required |
|---|---|---|
| Auth | `/api/auth/**` | ❌ Public |
| Destinations | `/api/destinations/**` | ❌ Public |
| Document downloads | `/api/documents/download/**` | ❌ Public (UUID-protected) |
| Trips | `/api/trips/**` | ✅ |
| Itineraries/Activities | `/api/itineraries/**`, `/api/activities/**` | ✅ |
| Budget/Expenses | `/api/budget/**`, `/api/expenses/**` | ✅ |
| Groups | `/api/groups/**` | ✅ |
| Notifications | `/api/notifications/**` | ✅ |
| Documents (upload) | `/api/documents/upload` | ✅ |
| Trip Sharing | `/api/trip-shares/**` | ✅ |

All protected endpoints require an `Authorization: Bearer <JWT>` header, automatically attached by the frontend's Axios interceptor once logged in.

---

## 🎨 Design System

TripNest uses a custom **"Aurora" theme**:
- Deep Navy `#0a0f1e`, Purple `#7c3aed`, Cyan `#06b6d4`
- Glassmorphism cards via CSS classes: `glass-card`, `btn-aurora`, `aurora-input`, `gradient-text`, `badge badge-{status}`

---

## 🧑‍💻 Coding Conventions

- Package root: `com.tripnest` (main class is the sole exception: `com.tripnest.tripnest.TripnestApplication`)
- Lombok `@Data` only — no manual getters/setters
- `@Column(length = ...)` for varchar sizing
- Ownership checks pattern: `if (!resource.getUser().getId().equals(userId)) throw new RuntimeException("Unauthorized");`
- Every new module follows: `entity → repository → dto → service → controller`
- Frontend API calls always go through `src/services/api.js`

---

## 👤 Author

Sachin — Solo Developer, Infosys Springboard Internship 7.0

---

## 📄 License

This project is developed for educational purposes as part of Infosys Springboard Internship 7.0.