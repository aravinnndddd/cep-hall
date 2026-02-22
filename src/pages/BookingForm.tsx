import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { db, storage } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { Resource, Booking } from "../types";
import { motion } from "motion/react";
import { Calendar, Clock, Users, FileText, Send, AlertCircle, Check } from "lucide-react";
import SignaturePad from "../components/SignaturePad";

const BookingForm: React.FC = () => {
  const { resourceId, bookingId } = useParams<{ resourceId?: string; bookingId?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [resource, setResource] = useState<Resource | null>(null);
  const [existingBooking, setExistingBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

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
    const fetchData = async () => {
      try {
        let currentResourceId = resourceId;

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
            currentResourceId = bData.resourceId;
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
        }

        if (currentResourceId) {
          const docRef = doc(db, "resources", currentResourceId);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setResource({ id: docSnap.id, ...docSnap.data() } as Resource);
          } else if (currentResourceId.startsWith("seed-")) {
            const defaults = [
              { name: "NOS Lab", type: "Lab", capacity: 30 },
              { name: "System Lab", type: "Lab", capacity: 40 },
              { name: "ASAP Lab", type: "Lab", capacity: 25 },
              { name: "CS Seminar Hall", type: "Hall", capacity: 100 },
              { name: "Admin Block Seminar Hall", type: "Hall", capacity: 150 },
            ];
            const index = parseInt(currentResourceId.split("-")[1]);
            setResource({ ...defaults[index], id: currentResourceId } as Resource);
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resourceId, bookingId, user]);

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
      where("date", "==", formData.date),
      where("status", "in", ["approved", "pending"])
    );

    const querySnapshot = await getDocs(q);
    const existingBookings = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Booking))
      .filter(b => b.id !== bookingId);

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
      if (!signature && !bookingId) throw new Error("Please provide your digital signature.");

      if (parseInt(formData.participants) > resource.capacity) {
        throw new Error(`Participants exceed capacity of ${resource.capacity}`);
      }

      const isAvailable = await checkAvailability();
      if (!isAvailable) {
        throw new Error("This resource is already booked for the selected time slot.");
      }

      let signatureUrl = existingBooking?.organizerSignatureUrl || "";
      
      if (signature) {
        const storageRef = ref(storage, `signatures/${user.uid}_${Date.now()}.png`);
        await uploadString(storageRef, signature, "data_url");
        signatureUrl = await getDownloadURL(storageRef);
      }

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
        status: "pending",
        organizerSignatureUrl: signatureUrl,
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
            <SignaturePad 
              label="Digital Signature" 
              onSave={(data) => setSignature(data)} 
              onClear={() => setSignature(null)}
            />
            {signature && (
              <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <Check className="w-3 h-3" /> Signature captured successfully
              </p>
            )}
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
