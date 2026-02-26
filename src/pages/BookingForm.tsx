import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  collection,
  addDoc,
  getDoc,
  doc,
  query,
  where,
  getDocs,
  serverTimestamp,
  updateDoc,
  or,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { Resource, Booking } from "../types";
import { motion } from "motion/react";
import {
  Calendar,
  Clock,
  Users,
  FileText,
  Send,
  AlertCircle,
  Check,
  ArrowLeft,
} from "lucide-react";
import { cn } from "../lib/utils";

const BookingForm: React.FC = () => {
  const { resourceId, bookingId } = useParams<{
    resourceId?: string;
    bookingId?: string;
  }>();
  const location = useLocation();
  const { user, resources } = useAuth();
  const navigate = useNavigate();

  const [resource, setResource] = useState<Resource | null>(
    location.state?.resource || null,
  );
  const [existingBooking, setExistingBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(!location.state?.resource);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dayBookings, setDayBookings] = useState<Booking[]>([]);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    eventName: "",
    organizerName: user?.displayName || "",
    department: "",
    facultyInCharge: "",
    organization: "",
    date: "",
    endDate: "",
    startTime: "",
    endTime: "",
    participants: "",
    equipment: "",
    purpose: "",
  });
  const DEPARTMENTS = [
    "Computer Science",
    "Electronics",
    "Electrical",
    "Mechanical",
    "Administration",
  ];
  const ORGNATIZATION = [
    "CSI",
    "Ecell",
    "GDG On campus",
    "IEDC",
    "IEEE",
    "Mulearn",
    "ThinkerHUB",

    "NIC",
  ];
  const toMinutes = (time: string) => {
    if (!time) return 0;
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const getTimestamp = (date: string, time: string) => {
    if (!date || !time) return 0;
    return new Date(`${date}T${time}`).getTime();
  };

  useEffect(() => {
    const fetchBookings = async () => {
      if (!resource?.id || !formData.date) return;

      // Fetch all bookings for this resource to ensure we catch multi-day overlaps
      // In a real app, we'd filter by a reasonable date range to optimize
      const q = query(
        collection(db, "bookings"),
        where("resourceId", "==", resource.id),
      );

      try {
        const snap = await getDocs(q);
        const allBookings = snap.docs.map(
          (doc) => ({ id: doc.id, ...(doc.data() as any) }) as Booking,
        );

        // Filter client-side for the selected range
        const startRange = new Date(formData.date).getTime();
        const endRange = formData.endDate
          ? new Date(formData.endDate).getTime() + 86400000
          : startRange + 86400000;

        const filtered = allBookings.filter((b) => {
          const bStart = new Date(b.date).getTime();
          const bEnd = b.endDate ? new Date(b.endDate).getTime() : bStart;
          return bStart <= endRange && bEnd >= startRange;
        });

        setDayBookings(filtered);
      } catch (err) {
        console.error("Error fetching bookings:", err);
      }
    };
    fetchBookings();
  }, [resource?.id, formData.date, formData.endDate]);

  const getTimeStatus = (hour: number) => {
    // For visualization, we check if the slot is occupied on ANY day in the selected range
    let currentStatus: "available" | "waiting" | "correction" | "approved" =
      "available";

    const startDate = new Date(formData.date);
    const endDate = formData.endDate ? new Date(formData.endDate) : startDate;

    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = d.toISOString().split("T")[0];
      const slotStart = getTimestamp(
        dateStr,
        `${hour.toString().padStart(2, "0")}:00`,
      );
      const slotEnd = getTimestamp(
        dateStr,
        `${(hour + 1).toString().padStart(2, "0")}:00`,
      );

      for (const b of dayBookings) {
        const bStart = getTimestamp(b.date, b.startTime);
        const bEnd = getTimestamp(b.endDate || b.date, b.endTime);

        if (bStart < slotEnd && bEnd > slotStart) {
          if (b.status === "approved") {
            return "bg-red-500"; // Immediate return for highest priority
          } else if (b.status.startsWith("waiting")) {
            currentStatus = "waiting";
          } else if (b.status === "correction_allowed") {
            if (currentStatus === "available") currentStatus = "correction";
          }
        }
      }
    }

    if (currentStatus === "waiting") return "bg-amber-400";
    if (currentStatus === "correction") return "bg-orange-500";
    return "bg-emerald-500";
  };

  const hours = Array.from({ length: 24 }, (_, i) => i); // 00:00 to 24:00

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (bookingId) {
          const bookingDoc = await getDoc(doc(db, "bookings", bookingId));
          if (bookingDoc.exists()) {
            const bData = {
              id: bookingDoc.id,
              ...bookingDoc.data(),
            } as Booking;

            const isExpired =
              bData.status === "correction_allowed" &&
              bData.correctionDeadline &&
              bData.correctionDeadline.toDate() < new Date();

            if (
              bData.userId !== user?.uid ||
              bData.status !== "correction_allowed" ||
              isExpired
            ) {
              setError(
                "You are not authorized to edit this booking or the deadline has passed.",
              );
              setLoading(false);
              return;
            }

            setExistingBooking(bData);

            // Try to find resource in cache first
            const cachedRes = resources.find((r) => r.id === bData.resourceId);
            if (cachedRes) {
              setResource(cachedRes);
            } else {
              const resDoc = await getDoc(
                doc(db, "resources", bData.resourceId),
              );
              if (resDoc.exists()) {
                setResource({ id: resDoc.id, ...resDoc.data() } as Resource);
              }
            }

            setFormData({
              eventName: bData.eventName,
              organizerName: bData.organizerName,
              department: bData.department,
              facultyInCharge: bData.facultyInCharge,
              organization: bData.organization,
              date: bData.date,
              endDate: bData.endDate || "",
              startTime: bData.startTime,
              endTime: bData.endTime,
              participants: bData.participants.toString(),
              equipment: bData.equipment,
              purpose: bData.purpose,
            });
          }
        } else if (resourceId && !resource) {
          // Try cache first
          const cachedRes = resources.find((r) => r.id === resourceId);
          if (cachedRes) {
            setResource(cachedRes);
          } else {
            const docRef = doc(db, "resources", resourceId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              setResource({ id: docSnap.id, ...docSnap.data() } as Resource);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resourceId, bookingId, user, resources, resource]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const checkAvailability = async () => {
    const resId = resource?.id;
    if (!resId) return false;

    const newStart = getTimestamp(formData.date, formData.startTime);
    const newEnd = getTimestamp(
      formData.endDate || formData.date,
      formData.endTime,
    );

    if (newEnd <= newStart) {
      throw new Error("End time must be after start time.");
    }

    return !dayBookings.some((booking) => {
      if (
        booking.id === bookingId ||
        ["rejected", "correction_allowed"].includes(booking.status)
      )
        return false;

      const bStart = getTimestamp(booking.date, booking.startTime);
      const bEnd = getTimestamp(
        booking.endDate || booking.date,
        booking.endTime,
      );

      return newStart < bEnd && newEnd > bStart;
    });
  };

  const validateStep = () => {
    if (step === 1) {
      return (
        formData.eventName &&
        formData.organizerName &&
        formData.department &&
        formData.facultyInCharge
      );
    }
    if (step === 2) {
      return formData.date && formData.startTime && formData.endTime;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) return;

    setError(null);
    setSubmitting(true);

    try {
      if (!user || !resource) throw new Error("Missing user or resource");

      if (parseInt(formData.participants) > resource.capacity) {
        throw new Error(`Participants exceed capacity of ${resource.capacity}`);
      }

      const isAvailable = await checkAvailability();
      if (!isAvailable) {
        throw new Error(
          "This resource is already booked for the selected time slot.",
        );
      }

      const initialStatus =
        resource.type === "Hall" ? "waiting_hod" : "waiting_staff";

      const bookingData: any = {
        eventName: formData.eventName,
        organizerName: formData.organizerName,
        department: formData.department,
        facultyInCharge: formData.facultyInCharge,
        date: formData.date,
        endDate: formData.endDate || null,
        startTime: formData.startTime,
        endTime: formData.endTime,
        participants: parseInt(formData.participants),
        equipment: formData.equipment,
        purpose: formData.purpose,
        status: initialStatus,

        hodApproved: false,
        staffApproved: false,
        principalApproved: false,
      };

      if (bookingId) {
        await updateDoc(doc(db, "bookings", bookingId), bookingData);
      } else {
        bookingData.userId = user.uid;
        bookingData.resourceId = resource.id;
        bookingData.resourceName = resource.name;
        bookingData.createdAt = serverTimestamp();
        await addDoc(collection(db, "bookings"), bookingData);
      }

      navigate("/my-bookings");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (!resource)
    return <div className="text-center py-12">Resource not found.</div>;

  return (
    <div className="h-[calc(100vh-120px)] flex items-center justify-center overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden w-full max-w-2xl flex flex-col max-h-full"
      >
        <div className="bg-zinc-900 p-6 text-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold">
              {bookingId ? "Edit Request" : `Book ${resource.name}`}
            </h2>
            <p className="text-zinc-400 text-xs mt-0.5">Step {step} of 3</p>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  "w-8 h-1.5 rounded-full transition-all duration-500",
                  step >= i ? "bg-white" : "bg-white/20",
                )}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative">
          <form onSubmit={handleSubmit} className="h-full flex flex-col">
            <div className="flex-1 p-8 overflow-y-auto">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2 text-xs mb-6">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="relative h-full">
                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-700 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-zinc-400" /> Event
                        Name
                      </label>
                      <input
                        required
                        name="eventName"
                        value={formData.eventName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all"
                        placeholder="e.g. Workshop on AI"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-700 flex items-center gap-2">
                          <Users className="w-4 h-4 text-zinc-400" /> Organizer
                        </label>
                        <input
                          required
                          name="organizerName"
                          value={formData.organizerName}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-zinc-700">
                          Organization name
                        </label>

                        <select
                          required
                          name="organization"
                          value={formData.organization}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-zinc-200 rounded-xl bg-white focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all"
                        >
                          <option value="" disabled>
                            Select Organization
                          </option>

                          {ORGNATIZATION.map((org) => (
                            <option key={org} value={org}>
                              {org}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-700">
                          Faculty In-Charge
                        </label>
                        <input
                          required
                          name="facultyInCharge"
                          value={formData.facultyInCharge}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all"
                          placeholder="Name of the faculty"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-zinc-700">
                          Venue Block
                        </label>

                        <select
                          required
                          name="department"
                          value={formData.department}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-zinc-200 rounded-xl bg-white focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all"
                        >
                          <option value="" disabled>
                            Select Venue Block
                          </option>

                          {DEPARTMENTS.map((dept) => (
                            <option key={dept} value={dept}>
                              {dept}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-zinc-700">
                          Availability (00:00 - 24:00)
                        </label>
                        <div className="flex gap-3 text-[7px] font-bold uppercase tracking-wider">
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{" "}
                            Free
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />{" "}
                            Wait
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />{" "}
                            Fix
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />{" "}
                            Busy
                          </div>
                        </div>
                      </div>
                      <div
                        className="grid gap-0.5 h-6"
                        style={{
                          gridTemplateColumns: "repeat(24, minmax(0, 1fr))",
                        }}
                      >
                        {hours.map((h) => (
                          <div
                            key={h}
                            className={cn(
                              "rounded-sm transition-colors relative group",
                              getTimeStatus(h),
                            )}
                          >
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] text-zinc-900 bg-white px-1 rounded border border-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-sm pointer-events-none">
                              {h.toString().padStart(2, "0")}:00
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-[7px] text-zinc-400 font-bold px-0.5">
                        <span>00:00</span>
                        <span>06:00</span>
                        <span>12:00</span>
                        <span>18:00</span>
                        <span>24:00</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-700 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-zinc-400" /> Start
                          Date
                        </label>
                        <input
                          required
                          type="date"
                          name="date"
                          value={formData.date}
                          onChange={handleChange}
                          min={new Date().toISOString().split("T")[0]}
                          className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-700 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-zinc-400" /> End
                          Date (Opt)
                        </label>
                        <input
                          type="date"
                          name="endDate"
                          value={formData.endDate}
                          onChange={handleChange}
                          min={
                            formData.date ||
                            new Date().toISOString().split("T")[0]
                          }
                          className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-700 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-zinc-400" /> Start Time
                        </label>
                        <p className="text-[10px] text-zinc-400 -mt-1">
                          On Start Date
                        </p>
                        <input
                          required
                          type="time"
                          name="startTime"
                          value={formData.startTime}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-700 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-zinc-400" /> End Time
                        </label>
                        <p className="text-[10px] text-zinc-400 -mt-1">
                          On {formData.endDate ? "End Date" : "Start Date"}
                        </p>
                        <input
                          required
                          type="time"
                          name="endTime"
                          value={formData.endTime}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-5"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-700">
                          Participants
                        </label>
                        <input
                          required
                          type="number"
                          name="participants"
                          value={formData.participants}
                          onChange={handleChange}
                          max={resource.capacity}
                          className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all"
                          placeholder={`Max ${resource.capacity}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-700">
                          Equipment
                        </label>
                        <input
                          name="equipment"
                          value={formData.equipment}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all"
                          placeholder="Projector, etc."
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-700">
                        Purpose
                      </label>
                      <textarea
                        required
                        name="purpose"
                        value={formData.purpose}
                        onChange={handleChange}
                        rows={2}
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all resize-none"
                        placeholder="Briefly describe..."
                      />
                    </div>

                    <div className="bg-zinc-900/5 border border-zinc-900/10 rounded-2xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-zinc-900 rounded flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                            Digital Agreement
                          </p>
                          <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                            Submitting this request acts as a digital signature
                            with your verified email:{" "}
                            <span className="font-bold text-zinc-900">
                              {user.email}
                            </span>
                            .
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="p-6 bg-zinc-50 border-t border-zinc-200 flex gap-3 shrink-0">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 px-6 py-4 border border-zinc-200 rounded-2xl font-bold text-zinc-600 hover:bg-zinc-100 transition-all active:scale-[0.98]"
                >
                  Back
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-[2] bg-zinc-900 text-white px-6 py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all active:scale-[0.98]"
                >
                  Continue
                </button>
              ) : (
                <button
                  disabled={submitting}
                  type="submit"
                  className="flex-[2] bg-emerald-600 text-white px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all disabled:opacity-50 active:scale-[0.98]"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      {bookingId ? "Update Request" : "Submit Request"}
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default BookingForm;
