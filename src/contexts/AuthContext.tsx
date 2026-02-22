import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  signOut, 
  User 
} from "firebase/auth";
import { auth, googleProvider, db } from "../lib/firebase";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { Resource } from "../types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  resources: Resource[];
  fetchResources: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);

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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAdmin(user?.email === "admin@college.edu" || user?.email?.startsWith("admin."));
      setLoading(false);
      
      if (user) {
        fetchResources();
      }
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
    <AuthContext.Provider value={{ user, loading, login, loginWithEmail, logout, isAdmin, resources, fetchResources }}>
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
