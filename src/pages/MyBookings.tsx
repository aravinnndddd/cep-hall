import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
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
  FileDown,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { generateRequestLetter } from "../utils/pdfGenerator";
import { cn } from "../lib/utils";

const MyBookings: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "bookings"),
      where("userId", "==", user.uid),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedBookings = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Booking,
      );
      // Sort client-side by createdAt descending
      fetchedBookings.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });
      setBookings(fetchedBookings);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const handleCancel = async (booking: Booking) => {
    const reason = window.prompt("Please provide a reason for cancellation:");
    if (reason === null) return; // User clicked cancel on prompt

    try {
      await updateDoc(doc(db, "bookings", booking.id), {
        status: "cancelled",
        rejectionReason: reason || "Cancelled by user",
      });
      alert("Booking cancelled successfully.");
    } catch (err) {
      console.error("Error cancelling booking:", err);
      alert("Failed to cancel booking.");
    }
  };

  const handleDelete = async (bookingId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this request?",
      )
    )
      return;

    try {
      await deleteDoc(doc(db, "bookings", bookingId));
      alert("Booking deleted successfully.");
    } catch (err) {
      console.error("Error deleting booking:", err);
      alert("Failed to delete booking.");
    }
  };

  if (loading)
    return <div className="text-center py-12">Loading your bookings...</div>;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">
          My Bookings
        </h1>
        <p className="text-zinc-500 mt-1">
          Track the status of your resource requests.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {bookings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-zinc-300">
            <p className="text-zinc-400 mb-4">
              You haven't made any bookings yet.
            </p>
            <Link to="/" className="text-zinc-900 font-bold underline">
              Browse Resources
            </Link>
          </div>
        ) : (
          bookings.map((booking) => {
            const isCorrectionAllowed = booking.status === "correction_allowed";
            const isExpired =
              isCorrectionAllowed &&
              booking.correctionDeadline &&
              booking.correctionDeadline.toDate() < new Date();
            const isCancelled = booking.status === "cancelled";

            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        booking.status === "approved"
                          ? "bg-emerald-100 text-emerald-700"
                          : booking.status.startsWith("waiting")
                            ? "bg-amber-100 text-amber-700"
                            : booking.status === "correction_allowed"
                              ? isExpired
                                ? "bg-zinc-100 text-zinc-500"
                                : "bg-blue-100 text-blue-700"
                              : booking.status === "cancelled"
                                ? "bg-zinc-100 text-zinc-500"
                                : "bg-red-100 text-red-700"
                      }`}
                    >
                      {isExpired ? "EXPIRED" : booking.status.replace("_", " ")}
                    </span>
                    <h3 className="text-lg font-bold text-zinc-900">
                      {booking.eventName}
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      <span>{booking.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>
                        {booking.startTime} - {booking.endTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      <span>{booking.resourceName}</span>
                    </div>
                  </div>

                  {(isCorrectionAllowed ||
                    isCancelled ||
                    booking.status === "rejected") && (
                    <div
                      className={cn(
                        "p-3 rounded-xl mt-2 border",
                        isCancelled || booking.status === "rejected"
                          ? "bg-zinc-50 border-zinc-100"
                          : "bg-blue-50 border-blue-100",
                      )}
                    >
                      <p
                        className={cn(
                          "text-sm font-medium flex items-center gap-2",
                          isCancelled || booking.status === "rejected"
                            ? "text-zinc-600"
                            : "text-blue-700",
                        )}
                      >
                        <AlertCircle className="w-4 h-4" />
                        {isCancelled ? "Cancelled Reason" : "Reason"}:{" "}
                        {booking.rejectionReason}
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
                  {!isCancelled &&
                    booking.status !== "rejected" &&
                    booking.status !== "approved" && (
                      <button
                        onClick={() => handleCancel(booking)}
                        className="flex items-center gap-2 bg-zinc-100 text-zinc-600 px-4 py-2 rounded-xl font-bold hover:bg-zinc-200 transition-all"
                      >
                        Cancel
                      </button>
                    )}
                  {(isCancelled || booking.status === "rejected") && (
                    <button
                      onClick={() => handleDelete(booking.id)}
                      className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl font-bold hover:bg-red-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
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
