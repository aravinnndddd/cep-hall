import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  Timestamp,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Booking } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Calendar as CalendarIcon,
  User,
  Building2,
  FileDown,
  Check,
} from "lucide-react";
import { generateRequestLetter } from "../utils/pdfGenerator";
import { cn } from "../lib/utils";
import { Link } from "react-router-dom";

const AdminPanel: React.FC = () => {
  const { user, approver } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Booking["status"] | "all">("all");

  const [rejectionModal, setRejectionModal] = useState<{
    id: string;
    open: boolean;
    type: "correction" | "rejection";
  }>({ id: "", open: false, type: "correction" });
  const [rejectionReason, setRejectionReason] = useState("");
  const [approving, setApproving] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setBookings(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Booking),
      );
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleApprove = async (booking: Booking) => {
    if (!user || !approver) return;
    setApproving(booking.id);
    try {
      const updateData: any = {};
      let nextStatus: Booking["status"] = booking.status;

      if (approver.role === "hod" && booking.status === "waiting_hod") {
        updateData.hodApproved = true;
        updateData.hodEmail = user.email;
        updateData.hodApprovedAt = serverTimestamp();
        nextStatus = "waiting_staff";
      } else if (
        approver.role === "staff" &&
        booking.status === "waiting_staff"
      ) {
        updateData.staffApproved = true;
        updateData.staffEmail = user.email;
        updateData.staffApprovedAt = serverTimestamp();
        nextStatus = "waiting_principal";
      } else if (
        approver.role === "principal" &&
        booking.status === "waiting_principal"
      ) {
        updateData.principalApproved = true;
        updateData.principalEmail = user.email;
        updateData.principalApprovedAt = serverTimestamp();
        nextStatus = "approved";
      }

      updateData.status = nextStatus;
      await updateDoc(doc(db, "bookings", booking.id), updateData);
    } catch (err) {
      console.error("Error approving booking:", err);
    } finally {
      setApproving(null);
    }
  };

  const isAuthorizedToApprove = (booking: Booking) => {
    if (!approver) return false;

    if (approver.role === "hod") {
      return (
        booking.status === "waiting_hod" &&
        approver.department === booking.department
      );
    }
    if (approver.role === "staff") {
      return (
        booking.status === "waiting_staff" &&
        (!approver.resourceId || approver.resourceId === booking.resourceId)
      );
    }
    if (approver.role === "principal") {
      return booking.status === "waiting_principal";
    }
    return false;
  };

  const handleReject = async () => {
    if (!rejectionReason) return;
    try {
      if (rejectionModal.type === "correction") {
        const deadline = new Date();
        deadline.setHours(deadline.getHours() + 1);

        await updateDoc(doc(db, "bookings", rejectionModal.id), {
          status: "correction_allowed",
          rejectionReason: rejectionReason,
          correctionDeadline: Timestamp.fromDate(deadline),
        });
      } else {
        await updateDoc(doc(db, "bookings", rejectionModal.id), {
          status: "rejected",
          rejectionReason: rejectionReason,
        });
      }
      setRejectionModal({ id: "", open: false, type: "correction" });
      setRejectionReason("");
    } catch (err) {
      console.error("Error rejecting booking:", err);
    }
  };

  const filteredBookings =
    filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  if (loading)
    return <div className="text-center py-12">Loading bookings...</div>;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">
            Admin Control Panel
          </h1>
          <p className="text-zinc-500 mt-1">
            Manage and review all resource booking requests.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white border border-zinc-200 p-1 rounded-xl overflow-x-auto">
          {(
            [
              "all",
              "waiting_hod",
              "waiting_staff",
              "waiting_principal",
              "approved",
              "correction_allowed",
              "rejected",
            ] as const
          ).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                filter === f
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "text-zinc-500 hover:bg-zinc-50"
              }`}
            >
              {f.replace("_", " ").charAt(0).toUpperCase() +
                f.replace("_", " ").slice(1)}
            </button>
          ))}
        </div>
      </header>
      <div className="gap-5 flex">
        <Link
          to="/admin/resources"
          className="bg-red-700 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-800 transition-colors inline-flex items-center gap-2"
        >
          Manage Resources
        </Link>
        <Link
          to="/admin/approvers"
          className="bg-red-700 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-800 transition-colors inline-flex items-center gap-2"
        >
          Manage Approvers
        </Link>
      </div>

      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-zinc-300">
            <p className="text-zinc-400">No bookings found for this filter.</p>
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <motion.div
              layout
              key={booking.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        booking.status === "approved"
                          ? "bg-emerald-100 text-emerald-700"
                          : booking.status.startsWith("waiting")
                            ? "bg-amber-100 text-amber-700"
                            : booking.status === "correction_allowed"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-red-100 text-red-700"
                      }`}
                    >
                      {booking.status.replace("_", " ")}
                    </span>
                    <h3 className="text-lg font-bold text-zinc-900">
                      {booking.eventName}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-zinc-500">
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
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{booking.organizerName}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap gap-3">
                    {isAuthorizedToApprove(booking) && (
                      <button
                        onClick={() => handleApprove(booking)}
                        disabled={approving === booking.id}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-emerald-200"
                      >
                        {approving === booking.id ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        Approve Request
                      </button>
                    )}

                    {isAuthorizedToApprove(booking) && (
                      <button
                        onClick={() => generateRequestLetter(booking)}
                        className="flex items-center gap-2 bg-zinc-100 text-zinc-900 px-6 py-2.5 rounded-xl font-bold hover:bg-zinc-200 transition-all active:scale-[0.98]"
                      >
                        <FileDown className="w-4 h-4" />
                        View Request
                      </button>
                    )}

                    {isAuthorizedToApprove(booking) && (
                      <button
                        onClick={() =>
                          setRejectionModal({
                            id: booking.id,
                            open: true,
                            type: "correction",
                          })
                        }
                        className="flex items-center gap-2 bg-blue-50 text-blue-600 px-6 py-2.5 rounded-xl font-bold hover:bg-blue-100 transition-all active:scale-[0.98]"
                      >
                        <AlertCircle className="w-4 h-4" />
                        Correction
                      </button>
                    )}

                    {isAuthorizedToApprove(booking) && (
                      <button
                        onClick={() =>
                          setRejectionModal({
                            id: booking.id,
                            open: true,
                            type: "rejection",
                          })
                        }
                        className="flex items-center gap-2 bg-red-50 text-red-600 px-6 py-2.5 rounded-xl font-bold hover:bg-red-100 transition-all active:scale-[0.98]"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-widest">
                    <div
                      className={`flex items-center gap-1.5 ${booking.hodApproved ? "text-emerald-600" : "text-zinc-400"}`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${booking.hodApproved ? "bg-emerald-500" : "bg-zinc-300"}`}
                      />
                      HOD {booking.hodApproved && `(${booking.hodEmail})`}
                    </div>
                    <div
                      className={`flex items-center gap-1.5 ${booking.staffApproved ? "text-emerald-600" : "text-zinc-400"}`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${booking.staffApproved ? "bg-emerald-500" : "bg-zinc-300"}`}
                      />
                      Staff {booking.staffApproved && `(${booking.staffEmail})`}
                    </div>
                    <div
                      className={`flex items-center gap-1.5 ${booking.principalApproved ? "text-emerald-600" : "text-zinc-400"}`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${booking.principalApproved ? "bg-emerald-500" : "bg-zinc-300"}`}
                      />
                      Principal{" "}
                      {booking.principalApproved &&
                        `(${booking.principalEmail})`}
                    </div>
                  </div>

                  {booking.status === "approved" && (
                    <button
                      onClick={() => generateRequestLetter(booking)}
                      className="flex items-center justify-center gap-2 bg-zinc-100 text-zinc-900 px-4 py-2 rounded-xl font-bold hover:bg-zinc-200 transition-all"
                    >
                      <FileDown className="w-4 h-4" />
                      Download Letter
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Rejection Modal */}
      <AnimatePresence>
        {rejectionModal.open && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-xl font-bold text-zinc-900 mb-4">
                {rejectionModal.type === "correction"
                  ? "Request Correction"
                  : "Reject Booking"}
              </h3>
              <p className="text-zinc-500 mb-6 text-sm">
                {rejectionModal.type === "correction"
                  ? "Provide a reason for correction. The user will have 1 hour to correct and resubmit their request."
                  : "Provide a reason for rejection. This will permanently reject the request."}
              </p>
              <textarea
                autoFocus
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none mb-6"
                placeholder={
                  rejectionModal.type === "correction"
                    ? "e.g. Please provide more details about the equipment needed."
                    : "e.g. Resource unavailable for this date."
                }
                rows={4}
              />
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setRejectionModal({
                      id: "",
                      open: false,
                      type: "correction",
                    })
                  }
                  className="flex-1 px-4 py-3 border border-zinc-200 rounded-xl font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectionReason}
                  className={cn(
                    "flex-1 px-4 py-3 text-white rounded-xl font-semibold transition-colors disabled:opacity-50",
                    rejectionModal.type === "correction"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-red-600 hover:bg-red-700",
                  )}
                >
                  {rejectionModal.type === "correction"
                    ? "Send Request"
                    : "Confirm Reject"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPanel;
