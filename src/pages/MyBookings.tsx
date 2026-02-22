import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { Booking } from "../types";
import { motion } from "motion/react";
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ArrowRight,
  Calendar as CalendarIcon,
  Building2,
  FileDown
} from "lucide-react";
import { Link } from "react-router-dom";
import { generateRequestLetter } from "../utils/pdfGenerator";

const MyBookings: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "bookings"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking)));
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  if (loading) return <div className="text-center py-12">Loading your bookings...</div>;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">My Bookings</h1>
        <p className="text-zinc-500 mt-1">Track the status of your resource requests.</p>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {bookings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-zinc-300">
            <p className="text-zinc-400 mb-4">You haven't made any bookings yet.</p>
            <Link to="/" className="text-zinc-900 font-bold underline">Browse Resources</Link>
          </div>
        ) : (
          bookings.map((booking) => {
            const isCorrectionAllowed = booking.status === "correction_allowed";
            const isExpired = isCorrectionAllowed && booking.correctionDeadline && booking.correctionDeadline.toDate() < new Date();

            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                      booking.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                      booking.status === "pending" ? "bg-amber-100 text-amber-700" :
                      booking.status === "correction_allowed" ? (isExpired ? "bg-zinc-100 text-zinc-500" : "bg-blue-100 text-blue-700") :
                      "bg-red-100 text-red-700"
                    }`}>
                      {isExpired ? "EXPIRED" : booking.status.replace("_", " ")}
                    </span>
                    <h3 className="text-lg font-bold text-zinc-900">{booking.eventName}</h3>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      <span>{booking.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{booking.startTime} - {booking.endTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      <span>{booking.resourceName}</span>
                    </div>
                  </div>

                  {isCorrectionAllowed && !isExpired && (
                    <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl mt-2">
                      <p className="text-sm text-blue-700 font-medium flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Correction Required: {booking.rejectionReason}
                      </p>
                      <p className="text-xs text-blue-500 mt-1">
                        Deadline: {booking.correctionDeadline?.toDate().toLocaleTimeString()}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {booking.status === "approved" && (
                    <button
                      onClick={() => generateRequestLetter(booking)}
                      className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl font-bold hover:bg-emerald-100 transition-all"
                    >
                      <FileDown className="w-4 h-4" />
                      Download Letter
                    </button>
                  )}
                  {isCorrectionAllowed && !isExpired && (
                    <Link
                      to={`/edit/${booking.id}`}
                      className="flex items-center gap-2 bg-zinc-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-zinc-800 transition-all"
                    >
                      Edit Request
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MyBookings;
