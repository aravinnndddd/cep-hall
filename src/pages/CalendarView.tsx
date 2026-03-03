import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Booking } from "../types";
import { useAuth } from "../contexts/AuthContext";
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
  subMonths,
} from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Building2,
  X,
  Calendar as CalendarIcon,
  Trash2,
} from "lucide-react";
import { cn } from "../lib/utils";
import toast from "react-hot-toast";

const CalendarView: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "bookings"),
      where("status", "in", [
        "approved",
        "pending",
        "waiting_hod",
        "waiting_staff",
        "waiting_principal",
        "correction_allowed",
      ]),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setBookings(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Booking),
      );
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleCancel = async (booking: Booking) => {
    const reason = window.prompt("Please provide a reason for cancellation:");
    if (reason === null) return;

    const loadingToast = toast.loading("Cancelling booking...");
    try {
      await updateDoc(doc(db, "bookings", booking.id), {
        status: "cancelled",
        rejectionReason: reason || "Cancelled by user",
      });
      setSelectedBooking(null);
      toast.success("Booking cancelled successfully.", { id: loadingToast });
    } catch (err) {
      console.error("Error cancelling booking:", err);
      toast.error("Failed to cancel booking.", { id: loadingToast });
    }
  };

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
  const goToToday = () => setCurrentDate(new Date());

  if (loading)
    return <div className="text-center py-12">Loading calendar...</div>;

  const isBookingOnDay = (booking: Booking, day: Date) => {
    const bStart = new Date(booking.date);
    const bEnd = booking.endDate ? new Date(booking.endDate) : bStart;

    // Reset times for accurate day comparison
    const d = new Date(day);
    d.setHours(0, 0, 0, 0);
    const s = new Date(bStart);
    s.setHours(0, 0, 0, 0);
    const e = new Date(bEnd);
    e.setHours(0, 0, 0, 0);

    return d >= s && d <= e;
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 tracking-tight">
            Resource Calendar
          </h1>
          <p className="text-zinc-500 mt-1 text-sm md:text-base">
            Real-time availability and scheduled events.
          </p>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-2 bg-white border border-zinc-200 p-1.5 rounded-2xl shadow-sm w-full md:w-auto">
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-zinc-50 rounded-xl transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-sm md:text-base font-bold text-zinc-900 min-w-[100px] md:min-w-[140px] text-center">
              {format(currentDate, "MMMM yyyy")}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-zinc-50 rounded-xl transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:block h-6 w-px bg-zinc-200 mx-1" />
            <button
              onClick={goToToday}
              className="px-4 py-2 text-xs md:text-sm font-bold text-zinc-600 hover:bg-zinc-50 rounded-xl transition-colors border border-zinc-100"
            >
              Today
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white rounded-3xl md:rounded-[2rem] border border-zinc-200 shadow-xl shadow-zinc-200/40 overflow-hidden">
        <div className="grid grid-cols-7 bg-zinc-50/50 border-b border-zinc-100">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
            <div
              key={i}
              className="py-3 md:py-4 text-center text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]"
            >
              <span className="hidden md:inline">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i]}
              </span>
              <span className="md:hidden">{day}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            const dayBookings = bookings.filter((b) => isBookingOnDay(b, day));
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());
            const isSelected = isSameDay(day, selectedDay);

            return (
              <div
                key={day.toString()}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "min-h-[80px] md:min-h-[160px] p-2 md:p-3 border-r border-b border-zinc-100 last:border-r-0 transition-all cursor-pointer relative",
                  !isCurrentMonth && "bg-zinc-50/30",
                  isToday && "bg-zinc-900/[0.02]",
                  isSelected && "ring-2 ring-inset ring-zinc-900 z-10",
                )}
              >
                <div className="flex justify-between items-start mb-1 md:mb-3">
                  <span
                    className={cn(
                      "text-xs md:text-sm font-bold w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full transition-colors",
                      !isCurrentMonth ? "text-zinc-300" : "text-zinc-500",
                      isToday && "bg-zinc-900 text-white",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {dayBookings.length > 0 && (
                    <div className="flex flex-col items-end">
                      <div className="md:hidden w-1.5 h-1.5 rounded-full bg-zinc-900" />
                      <span className="hidden md:inline text-[10px] font-bold text-zinc-300">
                        {dayBookings.length}{" "}
                        {dayBookings.length === 1 ? "Event" : "Events"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="hidden md:block space-y-1.5">
                  {dayBookings.slice(0, 4).map((booking) => (
                    <motion.button
                      key={booking.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBooking(booking);
                      }}
                      className={cn(
                        "w-full text-left px-2 py-1.5 rounded-xl text-[10px] font-bold truncate transition-all border shadow-sm",
                        booking.status === "approved"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"
                          : "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100",
                      )}
                    >
                      <div className="flex items-center gap-1">
                        <span className="opacity-50">{booking.startTime}</span>
                        <span>{booking.eventName}</span>
                      </div>
                    </motion.button>
                  ))}
                  {dayBookings.length > 4 && (
                    <div className="text-[9px] font-bold text-zinc-400 pl-2">
                      + {dayBookings.length - 4} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Agenda View */}
      <div className="md:hidden space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-zinc-900">
            {isSameDay(selectedDay, new Date())
              ? "Today's Schedule"
              : format(selectedDay, "EEEE, MMMM do")}
          </h3>
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            {bookings.filter((b) => isBookingOnDay(b, selectedDay)).length}{" "}
            Events
          </span>
        </div>

        <div className="space-y-3">
          {bookings.filter((b) => isBookingOnDay(b, selectedDay)).length ===
          0 ? (
            <div className="bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 py-8 text-center">
              <p className="text-sm text-zinc-400">
                No events scheduled for this day.
              </p>
            </div>
          ) : (
            bookings
              .filter((b) => isBookingOnDay(b, selectedDay))
              .map((booking) => (
                <motion.button
                  key={booking.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedBooking(booking)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left",
                    booking.status === "approved"
                      ? "bg-white border-emerald-100 shadow-sm shadow-emerald-100/50"
                      : "bg-white border-amber-100 shadow-sm shadow-amber-100/50",
                  )}
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0",
                      booking.status === "approved"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-amber-50 text-amber-600",
                    )}
                  >
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
                          booking.status === "approved"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700",
                        )}
                      >
                        {booking.status.replace("_", " ")}
                      </span>
                      <span className="text-xs font-bold text-zinc-400">
                        {booking.startTime}
                      </span>
                    </div>
                    <h4 className="font-bold text-zinc-900 truncate">
                      {booking.eventName}
                    </h4>
                    <p className="text-xs text-zinc-500 truncate">
                      {booking.resourceName}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-300" />
                </motion.button>
              ))
          )}
        </div>
      </div>

      {/* Booking Detail Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
            >
              <button
                onClick={() => setSelectedBooking(null)}
                className="absolute top-6 right-6 p-2 hover:bg-zinc-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>

              <div className="mb-6">
                <span
                  className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                    selectedBooking.status === "approved"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {selectedBooking.status.replace("_", " ")}
                </span>
                <h3 className="text-2xl font-bold text-zinc-900 mt-3">
                  {selectedBooking.eventName}
                </h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-zinc-600">
                  <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
                      Date
                    </p>
                    <p className="font-semibold">
                      {format(new Date(selectedBooking.date), "EEEE, MMMM do")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-zinc-600">
                  <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
                      Time
                    </p>
                    <p className="font-semibold">
                      {selectedBooking.startTime} - {selectedBooking.endTime}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-zinc-600">
                  <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
                      Resource
                    </p>
                    <p className="font-semibold">
                      {selectedBooking.resourceName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-zinc-600">
                  <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
                      Organizer
                    </p>
                    <p className="font-semibold">
                      {selectedBooking.organizerName} (
                      {selectedBooking.department})
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-zinc-100 flex flex-col gap-4">
                <div>
                  <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-2">
                    Purpose
                  </p>
                  <p className="text-sm text-zinc-600 leading-relaxed">
                    {selectedBooking.purpose}
                  </p>
                </div>

                {(user?.uid === selectedBooking.userId || isAdmin) &&
                  selectedBooking.status !== "cancelled" &&
                  selectedBooking.status !== "rejected" && (
                    <button
                      onClick={() => handleCancel(selectedBooking)}
                      className="w-full flex items-center justify-center gap-2 bg-zinc-100 text-zinc-600 px-6 py-3 rounded-2xl font-bold hover:bg-zinc-200 transition-all mt-4"
                    >
                      <Trash2 className="w-4 h-4" />
                      Cancel Booking
                    </button>
                  )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CalendarView;
