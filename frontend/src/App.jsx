import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
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
import Profile from "./pages/Profile";
import Budget from "./pages/Budget";
import Notifications from "./pages/Notifications";
import NotificationPreferences from "./pages/NotificationPreferences";
import Groups from "./pages/Groups";
import GroupDetails from "./pages/GroupDetails";
import GroupDiscussion from "./pages/GroupDiscussion";
import Documents from "./pages/Documents";
import OAuth2Redirect from "./pages/OAuth2Redirect";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/trips" element={<PrivateRoute><Trips /></PrivateRoute>} />
          <Route path="/trips/new" element={<PrivateRoute><CreateTrip /></PrivateRoute>} />
          <Route path="/trips/:id" element={<PrivateRoute><TripDetail /></PrivateRoute>} />
          <Route path="/trips/:id/edit" element={<PrivateRoute><EditTrip /></PrivateRoute>} />
          <Route path="/itineraries" element={<PrivateRoute><Trips /></PrivateRoute>} />
          <Route path="/itineraries/:id" element={<PrivateRoute><Itineraries /></PrivateRoute>} />
          <Route path="/destinations" element={<PrivateRoute><Destinations /></PrivateRoute>} />
          <Route path="/destinations/:id" element={<PrivateRoute><DestinationDetails /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/budget" element={<PrivateRoute><Budget /></PrivateRoute>} />
          <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
          <Route path="/notification-preferences" element={<PrivateRoute><NotificationPreferences /></PrivateRoute>} />
          <Route path="/groups" element={<PrivateRoute><Groups /></PrivateRoute>} />
          <Route path="/groups/:id" element={<PrivateRoute><GroupDetails /></PrivateRoute>} />
          <Route path="/groups/:id/discussion" element={<PrivateRoute><GroupDiscussion /></PrivateRoute>} />
          <Route path="/documents" element={<PrivateRoute><Documents /></PrivateRoute>} />
          <Route path="/oauth2/redirect" element={<OAuth2Redirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;