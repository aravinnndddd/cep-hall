import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  signOut, 
  User 
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
          isActive: true
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
    const snapshot = await getDocs(collection(db, "authorizedApprovers"));
    if (snapshot.empty) {
      console.log("Seeding default approvers...");
      const defaultApprovers: Approver[] = [
        { email: "hod.cs@college.edu", role: "hod", department: "Computer Science", isActive: true },
        { email: "staff.nos@college.edu", role: "staff", resourceId: "nos-lab", isActive: true },
        { email: "principal@college.edu", role: "principal", isActive: true },
        { email: "admin@college.edu", role: "principal", isActive: true },
      ];
      for (const app of defaultApprovers) {
        await setDoc(doc(db, "authorizedApprovers", app.email), app);
      }
    }
  };

  const fetchResources = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "resources"));
      let resourceList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
      
      if (resourceList.length === 0) {
        console.log("Seeding default resources...");
        const defaultResources: Resource[] = [
          { 
            id: "nos-lab",
            name: "NOS Lab", 
            type: "Lab", 
            department: "Computer Science",
            capacity: 40, 
            description: "Network and Operating Systems lab with high-speed internet and 40 systems.",
            equipment: "40 Workstations, Cisco Routers, Switches, High-speed LAN",
            imageUrl: "https://picsum.photos/seed/noslab/800/600"
          },
          { 
            id: "system-lab",
            name: "System Lab", 
            type: "Lab", 
            department: "Information Technology",
            capacity: 35, 
            description: "General purpose programming lab suitable for workshops and training sessions.",
            equipment: "35 Workstations, Projector, Whiteboard",
            imageUrl: "https://picsum.photos/seed/systemlab/800/600"
          },
          { 
            id: "asap-lab",
            name: "ASAP Lab", 
            type: "Lab", 
            department: "Skill Development",
            capacity: 30, 
            description: "Advanced Skill Acquisition Program lab with modern systems and projector.",
            equipment: "30 High-end Laptops, Smart Board, Audio System",
            imageUrl: "https://picsum.photos/seed/asaplab/800/600"
          },
          { 
            id: "cs-hall",
            name: "CS Seminar Hall", 
            type: "Hall", 
            department: "Computer Science",
            capacity: 120, 
            description: "Department seminar hall suitable for technical talks and events.",
            equipment: "PA System, Projector, Air Conditioning, 120 Seats",
            imageUrl: "https://picsum.photos/seed/cshall/800/600"
          },
          { 
            id: "admin-hall",
            name: "Admin Block Seminar Hall", 
            type: "Hall", 
            department: "Administration",
            capacity: 250, 
            description: "Large hall for college-level events, meetings, and workshops.",
            equipment: "Stage, Premium Sound System, Dual Projectors, 250 Seats",
            imageUrl: "https://picsum.photos/seed/adminhall/800/600"
          },
        ];

        for (const res of defaultResources) {
          const { id, ...data } = res;
          await setDoc(doc(db, "resources", id), data);
        }
        // Re-fetch after seeding
        const newSnapshot = await getDocs(collection(db, "resources"));
        resourceList = newSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
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
    <AuthContext.Provider value={{ user, loading, login, loginWithEmail, logout, isAdmin, approver, resources, fetchResources }}>
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
