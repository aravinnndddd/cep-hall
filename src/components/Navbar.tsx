import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LogOut, LayoutDashboard, Calendar, User, Shield } from "lucide-react";

const Navbar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white border-b border-zinc-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-zinc-900">Booker</span>
            </Link>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              <Link to="/" className="text-zinc-600 hover:text-zinc-900 px-1 pt-1 text-sm font-medium flex items-center gap-1">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <Link to="/calendar" className="text-zinc-600 hover:text-zinc-900 px-1 pt-1 text-sm font-medium flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Calendar
              </Link>
              {isAdmin && (
                <Link to="/admin" className="text-zinc-600 hover:text-zinc-900 px-1 pt-1 text-sm font-medium flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  Admin
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-zinc-50 rounded-full border border-zinc-200">
              <User className="w-4 h-4 text-zinc-500" />
              <span className="text-xs font-medium text-zinc-700">{user?.displayName || user?.email}</span>
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
  );
};

export default Navbar;
