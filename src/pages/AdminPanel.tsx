import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  Timestamp,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Booking, Resource } from "../types";
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
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  ArrowRight,
} from "lucide-react";
import { generateRequestLetter } from "../utils/pdfGenerator";
import { cn } from "../lib/utils";
import toast from "react-hot-toast";
import AdminResources from "./AdminResources";
import AdminApprovers from "./AdminApprovers";

const AdminPanel: React.FC = () => {
  const { user, approver, resources, fetchResources } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "bookings" | "resources" | "approvers"
  >("bookings");
  const [filter, setFilter] = useState<Booking["status"] | "all">("all");

  const [rejectionModal, setRejectionModal] = useState<{
    id: string;
    open: boolean;
    type: "correction" | "rejection";
  }>({ id: "", open: false, type: "correction" });
  const [rejectionReason, setRejectionReason] = useState("");
  const [approving, setApproving] = useState<string | null>(null);

  const [editingResource, setEditingResource] = useState<string | null>(null);
  const [resourceFormData, setResourceFormData] = useState<Partial<Resource>>(
    {},
  );
  const [isAddingResource, setIsAddingResource] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "bookings"), orderBy("createdAt", "asc"));
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
    const loadingToast = toast.loading("Approving request...");
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
      toast.success("Request approved successfully.", { id: loadingToast });
    } catch (err) {
      console.error("Error approving booking:", err);
      toast.error("Failed to approve request.", { id: loadingToast });
    } finally {
      setApproving(null);
    }
  };

  const isAuthorizedToApprove = (booking: Booking) => {
    if (!approver) return false;

    // Basic authorization check
    let isAuthorized = false;
    if (approver.role === "hod") {
      isAuthorized =
        booking.status === "waiting_hod" &&
        approver.department === booking.department;
    } else if (approver.role === "staff") {
      isAuthorized =
        booking.status === "waiting_staff" &&
        (!approver.resourceId || approver.resourceId === booking.resourceId);
    } else if (approver.role === "principal") {
      isAuthorized = booking.status === "waiting_principal";
    }

    if (!isAuthorized) return false;

    // FIFO Check: Ensure no older pending requests exist for this approver's queue
    const olderPending = bookings.find((b) => {
      if (b.id === booking.id) return false;

      // Only compare with bookings that have a valid createdAt timestamp
      if (!b.createdAt || !booking.createdAt) return false;

      // Check if b is older than current booking
      if (b.createdAt.toMillis() >= booking.createdAt.toMillis()) return false;

      // Check if the approver is also responsible for this older booking in the same status
      if (approver.role === "hod") {
        return (
          b.status === "waiting_hod" && approver.department === b.department
        );
      }
      if (approver.role === "staff") {
        return (
          b.status === "waiting_staff" &&
          (!approver.resourceId || approver.resourceId === b.resourceId)
        );
      }
      if (approver.role === "principal") {
        return b.status === "waiting_principal";
      }
      return false;
    });

    return !olderPending;
  };

  const getFIFOBlockedReason = (booking: Booking) => {
    if (!approver) return null;

    // Basic authorization check
    let isAuthorized = false;
    if (approver.role === "hod") {
      isAuthorized =
        booking.status === "waiting_hod" &&
        approver.department === booking.department;
    } else if (approver.role === "staff") {
      isAuthorized =
        booking.status === "waiting_staff" &&
        (!approver.resourceId || approver.resourceId === booking.resourceId);
    } else if (approver.role === "principal") {
      isAuthorized = booking.status === "waiting_principal";
    }

    if (!isAuthorized) return null;

    const olderPending = bookings.find((b) => {
      if (b.id === booking.id) return false;
      if (!b.createdAt || !booking.createdAt) return false;
      if (b.createdAt.toMillis() >= booking.createdAt.toMillis()) return false;

      if (approver.role === "hod") {
        return (
          b.status === "waiting_hod" && approver.department === b.department
        );
      }
      if (approver.role === "staff") {
        return (
          b.status === "waiting_staff" &&
          (!approver.resourceId || approver.resourceId === b.resourceId)
        );
      }
      if (approver.role === "principal") {
        return b.status === "waiting_principal";
      }
      return false;
    });

    return olderPending ? "Process older requests first" : null;
  };

  const handleReject = async () => {
    if (!rejectionReason) {
      toast.error("Please provide a reason.");
      return;
    }
    const loadingToast = toast.loading("Processing rejection...");
    try {
      if (rejectionModal.type === "correction") {
        const deadline = new Date();
        deadline.setHours(deadline.getHours() + 1);

        await updateDoc(doc(db, "bookings", rejectionModal.id), {
          status: "correction_allowed",
          rejectionReason: rejectionReason,
          correctionDeadline: Timestamp.fromDate(deadline),
        });
        toast.success("Correction requested.", { id: loadingToast });
      } else {
        await updateDoc(doc(db, "bookings", rejectionModal.id), {
          status: "rejected",
          rejectionReason: rejectionReason,
        });
        toast.success("Request rejected.", { id: loadingToast });
      }
      setRejectionModal({ id: "", open: false, type: "correction" });
      setRejectionReason("");
    } catch (err) {
      console.error("Error rejecting booking:", err);
      toast.error("Failed to process rejection.", { id: loadingToast });
    }
  };

  const handleUpdateResource = async (id: string) => {
    const loadingToast = toast.loading("Updating resource...");
    try {
      await updateDoc(doc(db, "resources", id), resourceFormData);
      setEditingResource(null);
      fetchResources();
      toast.success("Resource updated.", { id: loadingToast });
    } catch (err) {
      console.error("Error updating resource:", err);
      toast.error("Failed to update resource.", { id: loadingToast });
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this resource?"))
      return;
    const loadingToast = toast.loading("Deleting resource...");
    try {
      await deleteDoc(doc(db, "resources", id));
      fetchResources();
      toast.success("Resource deleted.", { id: loadingToast });
    } catch (err) {
      console.error("Error deleting resource:", err);
      toast.error("Failed to delete resource.", { id: loadingToast });
    }
  };

  const handleAddResource = async () => {
    try {
      await addDoc(collection(db, "resources"), {
        ...resourceFormData,
      });
      setIsAddingResource(false);
      setResourceFormData({});
      fetchResources();
    } catch (err) {
      console.error("Error adding resource:", err);
    }
  };

  const [isApprovedOpen, setIsApprovedOpen] = useState(false);

  const filteredBookings =
    filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  const approvedBookings = filteredBookings.filter(
    (b) => b.status === "approved",
  );
  const otherBookings = filteredBookings.filter((b) => b.status !== "approved");

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

        <div className="flex items-center gap-2 bg-white border border-zinc-200 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("bookings")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === "bookings"
                ? "bg-zinc-900 text-white shadow-sm"
                : "text-zinc-500 hover:bg-zinc-50"
            }`}
          >
            Bookings
          </button>
          <button
            onClick={() => setActiveTab("resources")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === "resources"
                ? "bg-red-600 text-white shadow-sm"
                : "text-zinc-500 hover:bg-zinc-50"
            }`}
          >
            Resources
          </button>

          {approver?.role === "principal" && (
            <button
              onClick={() => setActiveTab("approvers")}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === "approvers"
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-zinc-500 hover:bg-zinc-50"
              }`}
            >
              Approvers
            </button>
          )}
        </div>
      </header>

      {activeTab === "bookings" ? (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 bg-white border border-zinc-200 p-1 rounded-xl overflow-x-auto flex-1">
              {(
                [
                  "all",
                  "waiting_hod",
                  "waiting_staff",
                  "waiting_principal",
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

            <div className="relative">
              <select
                value={filter === "approved" ? "approved" : ""}
                onChange={(e) =>
                  e.target.value && setFilter(e.target.value as any)
                }
                className={cn(
                  "appearance-none pl-4 pr-10 py-2.5 rounded-xl text-sm font-bold border transition-all outline-none cursor-pointer",
                  filter === "approved"
                    ? "bg-emerald-600 text-white border-emerald-500"
                    : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300",
                )}
              >
                <option value="" disabled>
                  More Statuses...
                </option>
                <option value="approved">Approved Requests</option>
                <option value="cancelled">Cancelled Requests</option>
              </select>
              <div
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none",
                  filter === "approved" ? "text-white" : "text-zinc-400",
                )}
              >
                <ArrowRight className="w-4 h-4 rotate-90" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {filteredBookings.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-zinc-300">
                <p className="text-zinc-400">
                  No bookings found for this filter.
                </p>
              </div>
            ) : (
              <>
                {/* Non-Approved Bookings */}
                <div className="space-y-4">
                  {otherBookings.map((booking) => (
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
                                booking.status.startsWith("waiting")
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
                            {getFIFOBlockedReason(booking) && (
                              <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                                <Clock className="w-3 h-3" />
                                {getFIFOBlockedReason(booking)}
                              </div>
                            )}
                            <div
                              className={`flex items-center gap-1.5 ${booking.hodApproved ? "text-emerald-600" : "text-zinc-400"}`}
                            >
                              <div
                                className={`w-2 h-2 rounded-full ${booking.hodApproved ? "bg-emerald-500" : "bg-zinc-300"}`}
                              />
                              HOD{" "}
                              {booking.hodApproved && `(${booking.hodEmail})`}
                            </div>
                            <div
                              className={`flex items-center gap-1.5 ${booking.staffApproved ? "text-emerald-600" : "text-zinc-400"}`}
                            >
                              <div
                                className={`w-2 h-2 rounded-full ${booking.staffApproved ? "bg-emerald-500" : "bg-zinc-300"}`}
                              />
                              Staff{" "}
                              {booking.staffApproved &&
                                `(${booking.staffEmail})`}
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
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Approved Bookings Collapsible (Only in 'All' view) */}
                {filter === "all" && approvedBookings.length > 0 && (
                  <div className="mt-8">
                    <button
                      onClick={() => setIsApprovedOpen(!isApprovedOpen)}
                      className="w-full flex items-center justify-between p-6 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-900 font-bold hover:bg-emerald-100 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        <span>
                          Approved Requests ({approvedBookings.length})
                        </span>
                      </div>
                      <motion.div
                        animate={{ rotate: isApprovedOpen ? 180 : 0 }}
                      >
                        <ArrowRight className="w-5 h-5 rotate-90" />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {isApprovedOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden space-y-4 mt-4"
                        >
                          {approvedBookings.map((booking) => (
                            <div
                              key={booking.id}
                              className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                            >
                              <div className="space-y-3 flex-1">
                                <div className="flex items-center gap-3">
                                  <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">
                                    Approved
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
                              <button
                                onClick={() => generateRequestLetter(booking)}
                                className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl font-bold hover:bg-emerald-100 transition-all"
                              >
                                <FileDown className="w-4 h-4" />
                                Download Letter
                              </button>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* If filter is specifically 'approved', show them normally */}
                {filter === "approved" &&
                  approvedBookings.map((booking) => (
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
                            <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">
                              Approved
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
                        <button
                          onClick={() => generateRequestLetter(booking)}
                          className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl font-bold hover:bg-emerald-100 transition-all"
                        >
                          <FileDown className="w-4 h-4" />
                          Download Letter
                        </button>
                      </div>
                    </motion.div>
                  ))}
              </>
            )}
          </div>
        </>
      ) : activeTab === "resources" ? (
        <div className="space-y-6">
          <AdminResources />
        </div>
      ) : (
        <div className="space-y-6">
          <AdminApprovers />
        </div>
      )}

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
