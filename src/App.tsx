/**
 * @file App.tsx
 * @description Main application entry point with routing configuration.
 * Sets up routes for all pages, manages authentication provider,
 * and initializes toast notifications and SEO management.
 */

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import BookingForm from "./pages/BookingForm";
import AdminPanel from "./pages/AdminPanel";
import MyBookings from "./pages/MyBookings";
import CalendarView from "./pages/CalendarView";
import AdminResources from "./pages/AdminResources";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import LandingPage from "./pages/LandingPage";
import AdminApprovers from "./pages/AdminApprovers";
import { Toaster } from "react-hot-toast";
import SeoManager from "./components/SeoManager";

/**
 * App Component
 *
 * Main application component that provides:
 * - Authentication context via AuthProvider
 * - Global toast notifications
 * - Client-side routing with React Router
 * - Dynamic SEO metadata management
 * - Protected admin routes
 *
 * Routes:
 * - `/` - Landing page (public)
 * - `/login` - Authentication page (public)
 * - `/dashboard` - User dashboard (protected)
 * - `/calendar` - Resource calendar view (protected)
 * - `/my-bookings` - User's bookings (protected)
 * - `/book/:resourceId` - New booking form (protected)
 * - `/edit/:bookingId` - Edit booking (protected)
 * - `/admin` - Admin panel (admin-only)
 * - `/admin/approvers` - Approver management (admin-only)
 * - `/admin/resources` - Resource management (admin-only)
 *
 * @returns {JSX.Element} Complete app with routing and providers
 */
export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Router>
        <SeoManager />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <AdminPanel />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/approvers"
              element={
                <ProtectedAdminRoute>
                  <AdminApprovers />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/resources"
              element={
                <ProtectedAdminRoute>
                  <AdminResources />
                </ProtectedAdminRoute>
              }
            />
            <Route path="/book/:resourceId" element={<BookingForm />} />
            <Route path="/edit/:bookingId" element={<BookingForm />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      {/* </NotificationProvider> */}
    </AuthProvider>
  );
}
