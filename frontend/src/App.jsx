import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import LoadingSpinner from "./components/ui/LoadingSpinner";
import ErrorBoundary from "./components/ui/ErrorBoundary";

// Eagerly loaded critical entry routes
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";

// Lazy-loaded routes for performance & code-splitting
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Trips = lazy(() => import("./pages/Trips"));
const TripDetail = lazy(() => import("./pages/TripDetail"));
const CreateTrip = lazy(() => import("./pages/CreateTrip"));
const EditTrip = lazy(() => import("./pages/EditTrip"));
const Itineraries = lazy(() => import("./pages/Itineraries"));
const Destinations = lazy(() => import("./pages/Destinations"));
const DestinationDetails = lazy(() => import("./pages/DestinationDetails"));
const DestinationExperiences = lazy(() => import("./pages/DestinationExperiences"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Memories = lazy(() => import("./pages/Memories"));
const Profile = lazy(() => import("./pages/Profile"));
const Budget = lazy(() => import("./pages/Budget"));
const Notifications = lazy(() => import("./pages/Notifications"));
const NotificationPreferences = lazy(() => import("./pages/NotificationPreferences"));
const Settings = lazy(() => import("./pages/Settings"));
const Groups = lazy(() => import("./pages/Groups"));
const GroupDetails = lazy(() => import("./pages/GroupDetails"));
const GroupDiscussion = lazy(() => import("./pages/GroupDiscussion"));
const Documents = lazy(() => import("./pages/Documents"));
const OAuth2Redirect = lazy(() => import("./pages/OAuth2Redirect"));
const About = lazy(() => import("./pages/About"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Contact = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Dedicated Admin Portal routes (isolated chunk)
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUserManagement = lazy(() => import("./pages/admin/AdminUserManagement"));
const AdminDestinationManagement = lazy(() => import("./pages/admin/AdminDestinationManagement"));
const AdminContactInbox = lazy(() => import("./pages/admin/AdminContactInbox"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));

export const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
};

export const AdminPrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  let isAdmin = false;

  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user && user.roles && (user.roles.includes("ROLE_ADMIN") || user.roles.includes("ADMIN"))) {
        isAdmin = true;
      }
    } catch {
      isAdmin = false;
    }
  }

  if (!token || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner fullScreen message="Loading TripNest..." />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/about" element={<About />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/oauth2/redirect" element={<OAuth2Redirect />} />
                <Route path="/destinations" element={<Destinations />} />
                <Route path="/destinations/:id" element={<DestinationDetails />} />
                <Route path="/destinations/:id/experiences" element={<DestinationExperiences />} />
                <Route path="/favorites" element={<PrivateRoute><Favorites /></PrivateRoute>} />

                {/* Protected Traveler Routes */}
                <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/trips" element={<PrivateRoute><Trips /></PrivateRoute>} />
                <Route path="/trips/new" element={<PrivateRoute><CreateTrip /></PrivateRoute>} />
                <Route path="/trips/:id" element={<PrivateRoute><TripDetail /></PrivateRoute>} />
                <Route path="/trips/:id/edit" element={<PrivateRoute><EditTrip /></PrivateRoute>} />
                <Route path="/itineraries" element={<PrivateRoute><Trips /></PrivateRoute>} />
                <Route path="/itineraries/:id" element={<PrivateRoute><Itineraries /></PrivateRoute>} />
                <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                <Route path="/budget" element={<PrivateRoute><Budget /></PrivateRoute>} />
                <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
                <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
                <Route path="/settings/notifications" element={<PrivateRoute><NotificationPreferences /></PrivateRoute>} />
                <Route path="/notification-preferences" element={<PrivateRoute><NotificationPreferences /></PrivateRoute>} />
                <Route path="/groups" element={<PrivateRoute><Groups /></PrivateRoute>} />
                <Route path="/groups/:id" element={<PrivateRoute><GroupDetails /></PrivateRoute>} />
                <Route path="/groups/:id/discussion" element={<PrivateRoute><GroupDiscussion /></PrivateRoute>} />
                <Route path="/documents" element={<PrivateRoute><Documents /></PrivateRoute>} />
                <Route path="/memories" element={<PrivateRoute><Memories /></PrivateRoute>} />

                {/* Dedicated Admin Portal Routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<AdminPrivateRoute><AdminDashboard /></AdminPrivateRoute>} />
                <Route path="/admin/users" element={<AdminPrivateRoute><AdminUserManagement /></AdminPrivateRoute>} />
                <Route path="/admin/destinations" element={<AdminPrivateRoute><AdminDestinationManagement /></AdminPrivateRoute>} />
                <Route path="/admin/messages" element={<AdminPrivateRoute><AdminContactInbox /></AdminPrivateRoute>} />
                <Route path="/admin/reports" element={<AdminPrivateRoute><AdminReports /></AdminPrivateRoute>} />

                {/* 404 Fallback Catch-all Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;