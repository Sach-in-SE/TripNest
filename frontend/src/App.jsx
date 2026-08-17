import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Trips from "./pages/Trips";
import TripDetail from "./pages/TripDetail";
import CreateTrip from "./pages/CreateTrip";
import EditTrip from "./pages/EditTrip";
import Itineraries from "./pages/Itineraries";
import Destinations from "./pages/Destinations";
import DestinationDetails from "./pages/DestinationDetails";
import Favorites from "./pages/Favorites";
import Memories from "./pages/Memories";
import Profile from "./pages/Profile";
import Budget from "./pages/Budget";
import Notifications from "./pages/Notifications";
import NotificationPreferences from "./pages/NotificationPreferences";
import Settings from "./pages/Settings";
import Groups from "./pages/Groups";
import GroupDetails from "./pages/GroupDetails";
import GroupDiscussion from "./pages/GroupDiscussion";
import Documents from "./pages/Documents";
import OAuth2Redirect from "./pages/OAuth2Redirect";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUserManagement from "./pages/admin/AdminUserManagement";
import AdminDestinationManagement from "./pages/admin/AdminDestinationManagement";
import AdminReports from "./pages/admin/AdminReports";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
};

const AdminPrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  let isAdmin = false;

  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user && user.roles && (user.roles.includes("ROLE_ADMIN") || user.roles.includes("ADMIN"))) {
        isAdmin = true;
      }
    } catch (e) {
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
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/oauth2/redirect" element={<OAuth2Redirect />} />
            <Route path="/destinations" element={<Destinations />} />
            <Route path="/destinations/:id" element={<DestinationDetails />} />
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
            <Route path="/admin/reports" element={<AdminPrivateRoute><AdminReports /></AdminPrivateRoute>} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;