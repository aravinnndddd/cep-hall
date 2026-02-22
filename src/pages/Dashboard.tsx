import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { motion } from "motion/react";
import { Building2, Users, ArrowRight, FlaskConical, Presentation, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../lib/utils";

interface Resource {
  id: string;
  name: string;
  type: "Lab" | "Hall";
  capacity: number;
}

const Dashboard: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "resources"));
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
        
        // If no resources, seed some default ones (for demo purposes)
        if (data.length === 0) {
          const defaults: Omit<Resource, 'id'>[] = [
            { name: "NOS Lab", type: "Lab", capacity: 30 },
            { name: "System Lab", type: "Lab", capacity: 40 },
            { name: "ASAP Lab", type: "Lab", capacity: 25 },
            { name: "CS Seminar Hall", type: "Hall", capacity: 100 },
            { name: "Admin Block Seminar Hall", type: "Hall", capacity: 150 },
          ];
          // In a real app, you'd use a script to seed Firestore
          // For this demo, we'll just show them
          setResources(defaults.map((d, i) => ({ ...d, id: `seed-${i}` })));
        } else {
          setResources(data);
        }
      } catch (error) {
        console.error("Error fetching resources:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Available Resources</h1>
          <p className="text-zinc-500 mt-1 text-lg">Select a lab or hall to start your booking request.</p>
        </div>
        <Link 
          to="/my-bookings" 
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-6 py-3 rounded-xl font-bold text-zinc-700 hover:bg-zinc-50 transition-all shadow-sm"
        >
          <Clock className="w-5 h-5" />
          My Bookings
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource, index) => (
          <motion.div
            key={resource.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group bg-white rounded-2xl border border-zinc-200 p-6 hover:shadow-lg hover:shadow-zinc-200/50 transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={cn(
                "p-3 rounded-xl",
                resource.type === "Lab" ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"
              )}>
                {resource.type === "Lab" ? <FlaskConical className="w-6 h-6" /> : <Presentation className="w-6 h-6" />}
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 bg-zinc-50 px-2 py-1 rounded">
                {resource.type}
              </span>
            </div>
            
            <h3 className="text-xl font-bold text-zinc-900 mb-2">{resource.name}</h3>
            
            <div className="flex items-center gap-4 text-zinc-500 text-sm mb-6">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>Capacity: {resource.capacity}</span>
              </div>
              <div className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                <span>Main Campus</span>
              </div>
            </div>

            <Link 
              to={`/book/${resource.id}`}
              className="flex items-center justify-between w-full bg-zinc-50 group-hover:bg-zinc-900 group-hover:text-white px-4 py-3 rounded-xl font-medium transition-all"
            >
              <span>Book Now</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
