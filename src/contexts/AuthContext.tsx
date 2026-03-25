/**
 * @file AuthContext.tsx
 * @description Authentication context and provider for global user state management.
 *
 * Manages:
 * - User authentication state (Firebase Auth)
 * - User role/approver data (Firestore)
 * - Available resources list
 * - Loading states during async operations
 *
 * Security:
 * - Super admin hardcoded for factory reset access
 * - Approver roles fetched from Firestore for flexibility
 * - Admin status only if explicitly active
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import { auth, googleProvider, db } from "../lib/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { Resource, Approver } from "../types";

/**
 * Authentication context type definition
 * @interface AuthContextType
 * @property {User|null} user - Current Firebase Auth user
 * @property {boolean} loading - Whether authentication is still loading
 * @property {Function} login - Sign in with Google OAuth
 * @property {Function} loginWithEmail - Sign in with email and password
 * @property {Function} logout - Sign out current user
 * @property {boolean} isAdmin - Whether current user has approver role
 * @property {Approver|null} approver - Approver role data if user is admin
 * @property {Resource[]} resources - List of available resources for booking
 * @property {Function} fetchResources - Refresh resources from Firestore
 */
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  approver: Approver | null;
  resources: Resource[];
  fetchResources: () => Promise<void>;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Super admin email - has full access to all resources and admin panel
 * Change this to your admin email or use environment variables for security
 * @constant {string}
 * @todo Move to environment variable for security
 */
const SUPER_ADMIN = "admin@college.edu";

/**
 * AuthProvider Component
 *
 * Wraps the application to provide authentication state globally.
 * Must be placed at the root level or above components that need auth.
 *
 * Features:
 * - Firebase Auth state management
 * - Role-based access control (RBAC)
 * - Resource caching
 * - Automatic login persistence
 *
 * @component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Auth context provider
 *
 * @example
 * // In main.tsx or App.tsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [approver, setApprover] = useState<Approver | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);

  /**
   * Fetch approver role/permissions from Firestore
   *
   * Two-tier system:
   * 1. Super admin (hardcoded email) - full access
   * 2. Role-based approvers from Firestore
   *
   * @async
   * @param {string} email - User's email to look up
   * @returns {Promise<void>}
   *
   * @private
   */
  const fetchApproverData = async (email: string) => {
    try {
      // Check for super admin first (full access)
      if (email === SUPER_ADMIN) {
        setApprover({
          email,
          role: "principal",
          isActive: true,
        });
        setIsAdmin(true);
        return;
      }

      // Check Firestore for authorized approver role
      const approverDoc = await getDoc(doc(db, "authorizedApprovers", email));

      if (approverDoc.exists()) {
        const data = approverDoc.data() as Approver;

        // Only grant admin access if explicitly marked as active
        if (data.isActive) {
          setApprover(data);
          setIsAdmin(true);
          return;
        }
      }

      // Not an admin - regular user
      setApprover(null);
      setIsAdmin(false);
    } catch (error) {
      console.error("Error fetching approver data:", error);
      setApprover(null);
      setIsAdmin(false);
    }
  };

  /**
   * Fetch all available resources from Firestore
   * Called on login and can be called manually to refresh
   *
   * @async
   * @returns {Promise<void>}
   *
   * @private
   */
  const fetchResources = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "resources"));
      const resourceList = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Resource,
      );

      setResources(resourceList);
    } catch (error) {
      console.error("Error fetching resources:", error);
    }
  };

  /**
   * Listen for Firebase Auth state changes
   * Initializes user data on login and clears it on logout
   *
   * Syncs with Firestore to fetch user's role and available resources
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(true);

      if (currentUser && currentUser.email) {
        // User logged in - fetch their role and resources
        await fetchApproverData(currentUser.email);
        await fetchResources();
      } else {
        // User logged out - clear admin data
        setApprover(null);
        setIsAdmin(false);
        setResources([]);
      }

      setLoading(false);
    });

    // Cleanup Firebase listener on unmount
    return unsubscribe;
  }, []);

  /**
   * Sign in with Google OAuth popup
   * @async
   * @returns {Promise<void>}
   */
  const login = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  /**
   * Sign in with email and password
   * @async
   * @param {string} email - User email
   * @param {string} pass - User password
   * @returns {Promise<void>}
   */
  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  /**
   * Sign out current user
   * @async
   * @returns {Promise<void>}
   */
  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithEmail,
        logout,
        isAdmin,
        approver,
        resources,
        fetchResources,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to access authentication context
 *
 * Must be called within a component that is wrapped by AuthProvider
 *
 * @returns {AuthContextType} Authentication context value
 * @throws {Error} If used outside AuthProvider
 *
 * @example
 * const { user, login, logout } = useAuth();
 *
 * const handleLogin = async () => {
 *   await login();
 * };
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
