import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import {
  LogOut,
  LayoutDashboard,
  Calendar,
  User,
  Shield,
  Clock,
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

const Navbar: React.FC = () => {
  const { user, logout, isAdmin, approver } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  useEffect(() => {
    if (!isAdmin || !approver) {
      setPendingCount(0);
      return;
    }

    let q: any = null;

    // HOD → department based
    if (approver.role === "hod" && approver.department) {
      q = query(
        collection(db, "bookings"),
        where("status", "==", "waiting_hod"),
        where("department", "==", approver.department),
      );
    }

    // Staff → resource based
    else if (approver.role === "staff" && approver.resourceId) {
      q = query(
        collection(db, "bookings"),
        where("status", "==", "waiting_staff"),
        where("resourceId", "==", approver.resourceId),
      );
    }

    // Principal → all principal approvals
    else if (approver.role === "principal") {
      q = query(
        collection(db, "bookings"),
        where("status", "==", "waiting_principal"),
      );
    }

    if (!q) return;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [isAdmin, approver]);
  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const navLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/calendar", label: "Calendar", icon: Calendar },
    { to: "/my-bookings", label: "My Bookings", icon: Clock },
    ...(isAdmin ? [{ to: "/admin", label: "Admin", icon: Shield }] : []),
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      <nav className="bg-white border-b border-zinc-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={toggleSidebar}
                className="sm:hidden p-2 -ml-2 mr-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>

              <Link to="/" className="flex items-center gap-2">
                <img src="/logo.png" alt="logo" className="flex w-12" />
                <span className="font-bold text-xl tracking-tight text-zinc-900">
                  CEP Hall
                </span>
              </Link>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={cn(
                      "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium gap-1.5 transition-colors h-16",
                      location.pathname === link.to
                        ? "border-zinc-900 text-zinc-900"
                        : "border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300",
                    )}
                  >
                    <link.icon className="w-4 h-4" />
                    {link.label}
                    {link.to === "/admin" && pendingCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-1">
                        {pendingCount}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden xs:flex items-center gap-2 px-3 py-1 bg-zinc-50 rounded-full border border-zinc-200">
                <User className="w-4 h-4 text-zinc-500" />
                <span className="text-xs font-medium text-zinc-700 truncate max-w-[100px] sm:max-w-none">
                  {user?.displayName || user?.email}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-zinc-50 rounded-full border border-zinc-200">
                {" "}
                <User className="w-4 h-4 text-zinc-500" />{" "}
                <span className="text-xs font-medium text-zinc-700">
                  {" "}
                  {user?.displayName || user?.email}{" "}
                </span>{" "}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleSidebar}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 sm:hidden"
            />
            {/* Sidebar */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl z-50 sm:hidden flex flex-col"
            >
              <div className="p-6 flex items-center justify-between border-b border-zinc-100">
                <Link
                  to="/"
                  onClick={toggleSidebar}
                  className="flex items-center gap-2"
                >
                  <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-bold text-xl tracking-tight text-zinc-900">
                    Booker
                  </span>
                </Link>
                <button
                  onClick={toggleSidebar}
                  className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={toggleSidebar}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                      location.pathname === link.to
                        ? "bg-zinc-900 text-white shadow-lg shadow-zinc-900/20"
                        : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900",
                    )}
                  >
                    <link.icon className="w-5 h-5" />
                    {link.label}
                    {link.to === "/admin" && pendingCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {pendingCount}
                      </span>
                    )}
                  </Link>
                ))}
              </div>

              <div className="p-6 border-t border-zinc-100">
                <div className="flex items-center gap-3 mb-6 px-4">
                  <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-zinc-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-900 truncate">
                      {user?.displayName || "User"}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
