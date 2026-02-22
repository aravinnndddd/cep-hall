import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import BookingForm from "./pages/BookingForm";
import AdminPanel from "./pages/AdminPanel";
import MyBookings from "./pages/MyBookings";
import CalendarView from "./pages/CalendarView";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/book/:resourceId" element={<BookingForm />} />
            <Route path="/edit/:bookingId" element={<BookingForm />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
