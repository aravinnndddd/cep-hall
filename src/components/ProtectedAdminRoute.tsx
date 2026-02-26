import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, loading, isAdmin } = useAuth();

  // Wait for auth to load
  if (loading) {
    return <div className="text-center py-10">Checking access...</div>;
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Not admin / approver
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Allowed
  return <>{children}</>;
};

export default ProtectedAdminRoute;
