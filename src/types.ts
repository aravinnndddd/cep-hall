import { Timestamp } from "firebase/firestore";

export type BookingStatus = "pending" | "approved" | "correction_allowed" | "rejected" | "expired";

export interface Resource {
  id: string;
  name: string;
  type: "Lab" | "Hall";
  capacity: number;
}

export interface Booking {
  id: string;
  userId: string;
  eventName: string;
  organizerName: string;
  department: string;
  facultyInCharge: string;
  resourceId: string;
  resourceName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  participants: number;
  equipment: string;
  purpose: string;
  status: BookingStatus;
  rejectionReason?: string;
  correctionDeadline?: Timestamp;
  organizerSignatureUrl?: string;
  adminSignatureUrl?: string;
  createdAt: Timestamp;
}
