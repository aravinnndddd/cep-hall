import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import { auth, googleProvider, db } from "../lib/firebase";
import { collection, getDocs, doc, setDoc, getDoc } from "firebase/firestore";
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [approver, setApprover] = useState<Approver | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);

  const fetchApproverData = async (email: string) => {
    try {
      const approverDoc = await getDoc(doc(db, "authorizedApprovers", email));
      if (approverDoc.exists()) {
        const data = approverDoc.data() as Approver;
        if (data.isActive) {
          setApprover(data);
          setIsAdmin(true); // Approvers are considered admins in this context
          return;
        }
      }

      // Fallback for hardcoded admin
      if (email === "admin@college.edu") {
        const adminApprover: Approver = {
          email,
          role: "principal",
          isActive: true,
        };
        setApprover(adminApprover);
        setIsAdmin(true);
      } else {
        setApprover(null);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error("Error fetching approver data:", error);
    }
  };

  const seedApprovers = async () => {
    try {
      const snapshot = await getDocs(collection(db, "authorizedApprovers"));
      if (snapshot.empty) {
        console.log("Seeding default approvers...");
        const defaultApprovers: Approver[] = [
          {
            email: "hod.cs@college.edu",
            role: "hod",
            department: "Computer Science",
            isActive: true,
          },
          {
            email: "staff.nos@college.edu",
            role: "staff",
            resourceId: "nos-lab",
            isActive: true,
          },
          {
            email: "staff.asap@college.edu",
            role: "staff",
            resourceId: "asap-lab",
            isActive: true,
          },
          { email: "principal@college.edu", role: "principal", isActive: true },
          { email: "admin@college.edu", role: "staff", isActive: true },
        ];
        for (const app of defaultApprovers) {
          await setDoc(doc(db, "authorizedApprovers", app.email), app);
        }
      }
    } catch (error) {
      console.warn(
        "Could not seed approvers (likely permission issue):",
        error,
      );
    }
  };

  const fetchResources = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "resources"));
      let resourceList = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Resource,
      );

      if (resourceList.length === 0) {
        try {
          console.log("Seeding default resources...");
          const defaultResources: Resource[] = [
            {
              id: "nos-lab",
              name: "NOS Lab",
              type: "Lab",
              department: "Computer Science",
              capacity: 60,
            },
            {
              id: "system-lab",
              name: "System Lab",
              type: "Lab",
              department: "Information Technology",
              capacity: 45,
            },
            {
              id: "asap-lab",
              name: "ASAP Lab",
              type: "Lab",
              department: "Skill Development",
              capacity: 60,
            },
            {
              id: "cs-hall",
              name: "CS Seminar Hall",
              type: "Hall",
              department: "Computer Science",
              capacity: 60,
            },
            {
              id: "admin-hall",
              name: "Admin Block Seminar Hall",
              type: "Hall",
              department: "Administration",
              capacity: 70,
            },
          ];

          for (const res of defaultResources) {
            const { id, ...data } = res;
            await setDoc(doc(db, "resources", id), data);
          }
          // Re-fetch after seeding
          const newSnapshot = await getDocs(collection(db, "resources"));
          resourceList = newSnapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as Resource,
          );
        } catch (seedError) {
          console.warn(
            "Could not seed resources (likely permission issue):",
            seedError,
          );
        }
      }

      setResources(resourceList);
    } catch (error) {
      console.error("Error fetching resources:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(true);

      if (user && user.email) {
        await seedApprovers();
        await fetchApproverData(user.email);
        await fetchResources();
      } else {
        setApprover(null);
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
