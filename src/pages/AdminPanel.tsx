import React, { useEffect, useState } from "react";
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  Timestamp, 
  orderBy 
} from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { db, storage } from "../lib/firebase";
import { Booking } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Calendar as CalendarIcon,
  User,
  Building2,
  FileDown
} from "lucide-react";
import { generateRequestLetter } from "../utils/pdfGenerator";
import SignaturePad from "../components/SignaturePad";

const AdminPanel: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Booking["status"] | "all">("all");
  
  const [rejectionModal, setRejectionModal] = useState<{ id: string; open: boolean }>({ id: "", open: false });
  const [rejectionReason, setRejectionReason] = useState("");
  
  const [approvalModal, setApprovalModal] = useState<{ id: string; open: boolean }>({ id: "", open: false });
  const [adminSignature, setAdminSignature] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking)));
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleApprove = async () => {
    if (!adminSignature) return;
    setApproving(true);
    try {
      const storageRef = ref(storage, `signatures/admin_${approvalModal.id}_${Date.now()}.png`);
      await uploadString(storageRef, adminSignature, "data_url");
      const signatureUrl = await getDownloadURL(storageRef);

      await updateDoc(doc(db, "bookings", approvalModal.id), {
        status: "approved",
        adminSignatureUrl: signatureUrl
      });
      setApprovalModal({ id: "", open: false });
      setAdminSignature(null);
    } catch (err) {
      console.error("Error approving booking:", err);
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason) return;
    try {
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + 1);

      await updateDoc(doc(db, "bookings", rejectionModal.id), {
        status: "correction_allowed",
        rejectionReason: rejectionReason,
        correctionDeadline: Timestamp.fromDate(deadline)
      });
      setRejectionModal({ id: "", open: false });
      setRejectionReason("");
    } catch (err) {
      console.error("Error rejecting booking:", err);
    }
  };

  const filteredBookings = filter === "all" 
    ? bookings 
    : bookings.filter(b => b.status === filter);

  if (loading) return <div className="text-center py-12">Loading bookings...</div>;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Admin Control Panel</h1>
          <p className="text-zinc-500 mt-1">Manage and review all resource booking requests.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white border border-zinc-200 p-1 rounded-xl">
          {(["all", "pending", "approved", "correction_allowed", "rejected"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-500 hover:bg-zinc-50"
              }`}
            >
              {f.replace("_", " ").charAt(0).toUpperCase() + f.replace("_", " ").slice(1)}
            </button>
          ))}
        </div>
      </header>

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
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                      booking.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                      booking.status === "pending" ? "bg-amber-100 text-amber-700" :
                      booking.status === "correction_allowed" ? "bg-blue-100 text-blue-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {booking.status.replace("_", " ")}
                    </span>
                    <h3 className="text-lg font-bold text-zinc-900">{booking.eventName}</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-zinc-500">
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
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{booking.organizerName}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {booking.status === "pending" && (
                    <>
                      <button
                        onClick={() => setApprovalModal({ id: booking.id, open: true })}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => setRejectionModal({ id: booking.id, open: true })}
                        className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl font-semibold hover:bg-red-100 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </>
                  )}
                  {booking.status === "correction_allowed" && (
                    <div className="flex items-center gap-2 text-blue-600 text-sm font-medium bg-blue-50 px-3 py-1.5 rounded-lg">
                      <Clock className="w-4 h-4" />
                      <span>Awaiting Correction</span>
                    </div>
                  )}
                  {booking.status === "approved" && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium bg-emerald-50 px-3 py-1.5 rounded-lg">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approved</span>
                      </div>
                      <button
                        onClick={() => generateRequestLetter(booking)}
                        className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                        title="Download Request Letter"
                      >
                        <FileDown className="w-5 h-5" />
                      </button>
                    </div>
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
              <h3 className="text-xl font-bold text-zinc-900 mb-4">Reject Booking</h3>
              <p className="text-zinc-500 mb-6 text-sm">
                Provide a reason for rejection. The user will have 1 hour to correct and resubmit their request.
              </p>
              <textarea
                autoFocus
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none mb-6"
                placeholder="e.g. Please provide more details about the equipment needed."
                rows={4}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setRejectionModal({ id: "", open: false })}
                  className="flex-1 px-4 py-3 border border-zinc-200 rounded-xl font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectionReason}
                  className="flex-1 px-4 py-3 bg-zinc-900 text-white rounded-xl font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Approval Modal */}
      <AnimatePresence>
        {approvalModal.open && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-xl font-bold text-zinc-900 mb-4">Approve Booking</h3>
              <p className="text-zinc-500 mb-6 text-sm">
                Please provide your digital signature to authorize this booking request.
              </p>
              
              <SignaturePad 
                onSave={(data) => setAdminSignature(data)}
                onClear={() => setAdminSignature(null)}
              />

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setApprovalModal({ id: "", open: false })}
                  className="flex-1 px-4 py-3 border border-zinc-200 rounded-xl font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={!adminSignature || approving}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {approving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Confirm Approval"}
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
