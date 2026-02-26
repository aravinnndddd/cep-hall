import { Timestamp } from "firebase/firestore";

export type BookingStatus = "waiting_hod" | "waiting_staff" | "waiting_principal" | "approved" | "correction_allowed" | "rejected" | "cancelled";

export interface Resource {
  id: string;
  name: string;
  type: "Lab" | "Hall";
  department: string;
  capacity: number;

}

export interface Booking {
  id: string;
  userId: string;
  eventName: string;
  organizerName: string;
  department: string;
  facultyInCharge: string;
  organization: string;
  resourceId: string;
  resourceName: string;
  date: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  participants: number;

  equipment: string;
  purpose: string;
  status: BookingStatus;
  rejectionReason?: string;
  correctionDeadline?: Timestamp;
  createdAt: Timestamp;

  // Approval Metadata
  hodApproved: boolean;
  hodEmail?: string;
  hodApprovedAt?: Timestamp;
  
  staffApproved: boolean;
  staffEmail?: string;
  staffApprovedAt?: Timestamp;
  
  principalApproved: boolean;
  principalEmail?: string;
  principalApprovedAt?: Timestamp;
}

export interface Approver {
  email: string;
  role: "hod" | "staff" | "principal";
  department?: string;
  resourceId?: string;
  isActive: boolean;
}
