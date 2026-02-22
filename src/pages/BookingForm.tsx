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
  updateDoc
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { Resource, Booking } from "../types";
import { motion } from "motion/react";
import { Calendar, Clock, Users, FileText, Send, AlertCircle, Check, ArrowLeft } from "lucide-react";
import { cn } from "../lib/utils";

const BookingForm: React.FC = () => {
  const { resourceId, bookingId } = useParams<{ resourceId?: string; bookingId?: string }>();
  const location = useLocation();
  const { user, resources } = useAuth();
  const navigate = useNavigate();
  
  const [resource, setResource] = useState<Resource | null>(location.state?.resource || null);
  const [existingBooking, setExistingBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(!location.state?.resource);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dayBookings, setDayBookings] = useState<Booking[]>([]);

  const [formData, setFormData] = useState({
    eventName: "",
    organizerName: user?.displayName || "",
    department: "",
    facultyInCharge: "",
    date: "",
    startTime: "",
    endTime: "",
    participants: "",
    equipment: "",
    purpose: "",
  });

  useEffect(() => {
    const fetchDayBookings = async () => {
      if (!resource || !formData.date) return;
      const q = query(
        collection(db, "bookings"),
        where("resourceId", "==", resource.id),
        where("date", "==", formData.date)
      );
      const snap = await getDocs(q);
      setDayBookings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking)));
    };
    fetchDayBookings();
  }, [resource, formData.date]);

  const getTimeStatus = (hour: number) => {
    const timeStr = `${hour.toString().padStart(2, "0")}:00`;
    const booking = dayBookings.find(b => timeStr >= b.startTime && timeStr < b.endTime);
    if (!booking) return "bg-emerald-500";
    if (booking.status === "approved") return "bg-red-500";
    if (booking.status.startsWith("waiting")) return "bg-amber-400";
    if (booking.status === "correction_allowed") return "bg-orange-500";
    return "bg-emerald-500";
  };

  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (bookingId) {
          const bookingDoc = await getDoc(doc(db, "bookings", bookingId));
          if (bookingDoc.exists()) {
            const bData = { id: bookingDoc.id, ...bookingDoc.data() } as Booking;
            
            const isExpired = bData.status === "correction_allowed" && 
                             bData.correctionDeadline && 
                             bData.correctionDeadline.toDate() < new Date();
            
            if (bData.userId !== user?.uid || bData.status !== "correction_allowed" || isExpired) {
              setError("You are not authorized to edit this booking or the deadline has passed.");
              setLoading(false);
              return;
            }

            setExistingBooking(bData);
            
            // Try to find resource in cache first
            const cachedRes = resources.find(r => r.id === bData.resourceId);
            if (cachedRes) {
              setResource(cachedRes);
            } else {
              const resDoc = await getDoc(doc(db, "resources", bData.resourceId));
              if (resDoc.exists()) {
                setResource({ id: resDoc.id, ...resDoc.data() } as Resource);
              }
            }

            setFormData({
              eventName: bData.eventName,
              organizerName: bData.organizerName,
              department: bData.department,
              facultyInCharge: bData.facultyInCharge,
              date: bData.date,
              startTime: bData.startTime,
              endTime: bData.endTime,
              participants: bData.participants.toString(),
              equipment: bData.equipment,
              purpose: bData.purpose,
            });
          }
        } else if (resourceId && !resource) {
          // Try cache first
          const cachedRes = resources.find(r => r.id === resourceId);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const checkAvailability = async () => {
    const resId = resource?.id;
    if (!resId) return false;
    
    const bookingsRef = collection(db, "bookings");
    const q = query(
      bookingsRef,
      where("resourceId", "==", resId),
      where("date", "==", formData.date)
    );

    const querySnapshot = await getDocs(q);
    const existingBookings = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Booking))
      .filter(b => b.id !== bookingId && !["rejected", "correction_allowed"].includes(b.status));

    const newStart = formData.startTime;
    const newEnd = formData.endTime;

    return !existingBookings.some(booking => {
      return (newStart < booking.endTime && newEnd > booking.startTime);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (!user || !resource) throw new Error("Missing user or resource");

      if (parseInt(formData.participants) > resource.capacity) {
        throw new Error(`Participants exceed capacity of ${resource.capacity}`);
      }

      const isAvailable = await checkAvailability();
      if (!isAvailable) {
        throw new Error("This resource is already booked for the selected time slot.");
      }

      // Determine initial status
      // If department hall -> waiting_hod
      // Else -> waiting_staff
      const initialStatus = resource.type === "Hall" ? "waiting_hod" : "waiting_staff";

      const bookingData: any = {
        eventName: formData.eventName,
        organizerName: formData.organizerName,
        department: formData.department,
        facultyInCharge: formData.facultyInCharge,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        participants: parseInt(formData.participants),
        equipment: formData.equipment,
        purpose: formData.purpose,
        status: initialStatus,
        
        // Approval Metadata
        hodApproved: false,
        staffApproved: false,
        principalApproved: false,
      };

      if (bookingId) {
        // Reset status on update if it was correction_allowed
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
  if (!resource) return <div className="text-center py-12">Resource not found.</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden"
      >
        <div className="bg-zinc-900 p-6 text-white">
          <h2 className="text-2xl font-bold">{bookingId ? "Edit Request" : `Book ${resource.name}`}</h2>
          <p className="text-zinc-400 mt-1">Fill in the details for your event request.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-zinc-700">Availability for {formData.date || "selected date"}</label>
                <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Available</div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400" /> Requested</div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500" /> Correction</div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> Booked</div>
                </div>
              </div>
              <div 
                className="grid gap-1 h-8"
                style={{ gridTemplateColumns: "repeat(13, minmax(0, 1fr))" }}
              >
                {hours.map(h => (
                  <div 
                    key={h} 
                    className={cn("rounded-md transition-colors relative group", getTimeStatus(h))}
                  >
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {h}:00
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[8px] text-zinc-400 font-bold px-1 pt-1">
                <span>08:00</span>
                <span>12:00</span>
                <span>16:00</span>
                <span>20:00</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Event Name
              </label>
              <input
                required
                name="eventName"
                value={formData.eventName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all"
                placeholder="e.g. Workshop on AI"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                <Users className="w-4 h-4" /> Organizer Name
              </label>
              <input
                required
                name="organizerName"
                value={formData.organizerName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Department</label>
              <input
                required
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all"
                placeholder="e.g. Computer Science"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Faculty In-Charge</label>
              <input
                required
                name="facultyInCharge"
                value={formData.facultyInCharge}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Date
              </label>
              <input
                required
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                <Users className="w-4 h-4" /> Participants
              </label>
              <input
                required
                type="number"
                name="participants"
                value={formData.participants}
                onChange={handleChange}
                max={resource.capacity}
                className="w-full px-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all"
                placeholder={`Max ${resource.capacity}`}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Start Time
              </label>
              <input
                required
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                <Clock className="w-4 h-4" /> End Time
              </label>
              <input
                required
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">Equipment Needed</label>
            <textarea
              name="equipment"
              value={formData.equipment}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all"
              placeholder="e.g. Projector, Sound System, 20 Laptops"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">Purpose of Event</label>
            <textarea
              required
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all"
              placeholder="Briefly describe the purpose of this booking..."
            />
          </div>

          <div className="pt-4">
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-zinc-900 rounded flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-900">Digital Approval</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    By submitting this request, you agree that your verified email ({user.email}) will be used as a digital signature for this application.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              disabled={submitting}
              type="submit"
              className="w-full bg-zinc-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
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
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default BookingForm;
