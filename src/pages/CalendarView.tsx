import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Booking } from "../types";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths 
} from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User, 
  Building2, 
  X,
  Calendar as CalendarIcon
} from "lucide-react";

const CalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "bookings"), where("status", "in", ["approved", "pending", "correction_allowed"]));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking)));
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  if (loading) return <div className="text-center py-12">Loading calendar...</div>;

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Booking Calendar</h1>
          <p className="text-zinc-500 mt-1">View all scheduled events and resource availability.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white border border-zinc-200 p-2 rounded-2xl shadow-sm">
          <button onClick={prevMonth} className="p-2 hover:bg-zinc-50 rounded-xl transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold text-zinc-900 min-w-[140px] text-center">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <button onClick={nextMonth} className="p-2 hover:bg-zinc-50 rounded-xl transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 border-b border-zinc-100">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="py-4 text-center text-xs font-bold text-zinc-400 uppercase tracking-widest">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            const dayBookings = bookings.filter(b => isSameDay(new Date(b.date), day));
            const isCurrentMonth = isSameMonth(day, monthStart);

            return (
              <div
                key={day.toString()}
                className={`min-h-[140px] p-2 border-r border-b border-zinc-50 last:border-r-0 ${
                  !isCurrentMonth ? "bg-zinc-50/50" : ""
                }`}
              >
                <div className={`text-sm font-medium mb-2 ${
                  !isCurrentMonth ? "text-zinc-300" : "text-zinc-500"
                }`}>
                  {format(day, "d")}
                </div>
                
                <div className="space-y-1">
                  {dayBookings.map((booking) => (
                    <motion.button
                      layoutId={booking.id}
                      key={booking.id}
                      onClick={() => setSelectedBooking(booking)}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-[10px] font-bold truncate transition-all ${
                        booking.status === "approved" 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                          : "bg-amber-50 text-amber-700 border border-amber-100"
                      }`}
                    >
                      {booking.startTime} {booking.eventName}
                    </motion.button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Booking Detail Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              layoutId={selectedBooking.id}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setSelectedBooking(null)}
                className="absolute top-6 right-6 p-2 hover:bg-zinc-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>

              <div className="mb-6">
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                  selectedBooking.status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                }`}>
                  {selectedBooking.status.replace("_", " ")}
                </span>
                <h3 className="text-2xl font-bold text-zinc-900 mt-3">{selectedBooking.eventName}</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-zinc-600">
                  <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Date</p>
                    <p className="font-semibold">{format(new Date(selectedBooking.date), "EEEE, MMMM do")}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-zinc-600">
                  <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Time</p>
                    <p className="font-semibold">{selectedBooking.startTime} - {selectedBooking.endTime}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-zinc-600">
                  <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Resource</p>
                    <p className="font-semibold">{selectedBooking.resourceName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-zinc-600">
                  <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Organizer</p>
                    <p className="font-semibold">{selectedBooking.organizerName} ({selectedBooking.department})</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-zinc-100">
                <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-2">Purpose</p>
                <p className="text-sm text-zinc-600 leading-relaxed">{selectedBooking.purpose}</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CalendarView;
