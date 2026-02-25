import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "motion/react";
import {
  Users,
  ArrowRight,
  FlaskConical,
  Presentation,
  Clock,
  Info,
  Cpu,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../lib/utils";
import { Resource } from "../types";

const DEFAULT_RESOURCES: Resource[] = [
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

const Dashboard: React.FC = () => {
  const { resources } = useAuth();

  // Use Firestore resources if available, otherwise use defaults
  const displayResources = resources.length > 0 ? resources : DEFAULT_RESOURCES;

  const labs = displayResources.filter((r) => r.type === "Lab");
  const halls = displayResources.filter((r) => r.type === "Hall");

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-zinc-900 tracking-tight">
            Available Resources
          </h1>
          <p className="text-zinc-500 text-lg">
            Select a lab or seminar hall to start your booking request.
          </p>
        </div>
      </header>

      {/* Labs Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
            <FlaskConical className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900">Computer Labs</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {labs.map((lab) => (
            <ResourceCard key={lab.id} resource={lab} />
          ))}
        </div>
      </section>

      {/* Halls Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
            <Presentation className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900">Seminar Halls</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {halls.map((hall) => (
            <ResourceCard key={hall.id} resource={hall} />
          ))}
        </div>
      </section>
    </div>
  );
};

const ResourceCard: React.FC<{ resource: Resource }> = ({ resource }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-white rounded-3xl border border-zinc-200 overflow-hidden hover:shadow-2xl hover:shadow-zinc-200/50 transition-all duration-500 flex flex-col h-full"
    >
      <div className="p-6 space-y-4 flex-1 flex flex-col">
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-zinc-900 group-hover:text-zinc-700 transition-colors">
            {resource.name}
          </h3>
          <p className="text-xs text-zinc-400 font-medium uppercase tracking-widest">
            {resource.department}
          </p>
        </div>

        <div className="flex items-center gap-4 text-sm text-zinc-500">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span>{resource.capacity} Seats</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>24/7 Access</span>
          </div>
        </div>

        <Link
          to={`/book/${resource.id}`}
          state={{ resource }}
          className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-white px-6 py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all active:scale-[0.98] mt-auto"
        >
          Book Now
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
};

export default Dashboard;
