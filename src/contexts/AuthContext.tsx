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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// SUPER ADMIN EMAIL
const SUPER_ADMIN = "admin@college.edu";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [approver, setApprover] = useState<Approver | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);

  // ---------------------------------------------------
  // Fetch Approver Role (SECURE)
  // ---------------------------------------------------
  const fetchApproverData = async (email: string) => {
    try {
      // SUPER ADMIN (Full access)
      if (email === SUPER_ADMIN) {
        setApprover({
          email,
          role: "principal",
          isActive: true,
        });
        setIsAdmin(true);
        return;
      }

      // Check Firestore for role
      const approverDoc = await getDoc(doc(db, "authorizedApprovers", email));

      if (approverDoc.exists()) {
        const data = approverDoc.data() as Approver;

        if (data.isActive) {
          setApprover(data);
          setIsAdmin(true);
          return;
        }
      }

      // Normal user
      setApprover(null);
      setIsAdmin(false);
    } catch (error) {
      console.error("Error fetching approver data:", error);
      setApprover(null);
      setIsAdmin(false);
    }
  };

  // ---------------------------------------------------
  // Fetch Resources (Read Only)
  // ---------------------------------------------------
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

  // ---------------------------------------------------
  // Auth State Listener
  // ---------------------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(true);

      if (currentUser && currentUser.email) {
        await fetchApproverData(currentUser.email);
        await fetchResources();
      } else {
        setApprover(null);
        setIsAdmin(false);
        setResources([]);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // ---------------------------------------------------
  // Auth Functions
  // ---------------------------------------------------
  const login = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

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

// ---------------------------------------------------
// Hook
// ---------------------------------------------------
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
