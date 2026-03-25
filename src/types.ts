/**
 * @file types.ts
 * @description TypeScript type definitions and interfaces for the application.
 * Defines data models for bookings, resources, approvers, and related entities.
 */

import { Timestamp } from "firebase/firestore";

/**
 * Booking status throughout the approval workflow
 * @typedef {string} BookingStatus
 * - waiting_hod: Awaiting Head of Department approval
 * - waiting_staff: Awaiting staff approval
 * - waiting_principal: Awaiting principal approval
 * - approved: All approvals completed
 * - correction_allowed: Resubmission requested for corrections
 * - rejected: Booking was rejected
 * - cancelled: User cancelled the booking
 */
export type BookingStatus = "waiting_hod" | "waiting_staff" | "waiting_principal" | "approved" | "correction_allowed" | "rejected" | "cancelled";

/**
 * Resource (Lab/Hall) available for booking
 * @interface Resource
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 * @property {"Lab"|"Hall"} type - Resource type
 * @property {string} department - Department that owns the resource
 * @property {number} capacity - Maximum capacity/participants
 */
export interface Resource {
  id: string;
  name: string;
  type: "Lab" | "Hall";
  department: string;
  capacity: number;

}

/**
 * Booking request with multi-level approval workflow
 * Tracks approvals from HODs, staff, and principal
 * Spans across multiple departments with digital signatures
 * @interface Booking
 * @property {string} id - Unique booking identifier
 * @property {string} userId - Email of booking requester
 * @property {string} eventName - Name/title of the event
 * @property {string} organizerName - Name of the organizer
 * @property {string} department - Department making the booking
 * @property {string} facultyInCharge - Faculty member responsible
 * @property {string} organization - Organization/club name if applicable
 * @property {string} resourceId - ID of the booked resource
 * @property {string} resourceName - Name of the booked resource
 * @property {string} date - Start date in YYYY-MM-DD format
 * @property {string} [endDate] - End date if multi-day booking
 * @property {string} startTime - Start time in HH:mm format
 * @property {string} endTime - End time in HH:mm format
 * @property {number} participants - Expected number of participants
 * @property {string} equipment - Equipment/resources needed
 * @property {string} purpose - Purpose/reason for booking
 * @property {BookingStatus} status - Current approval workflow status
 * @property {string} [rejectionReason] - Reason if booking was rejected
 * @property {Timestamp} [correctionDeadline] - Deadline for corrections
 * @property {Timestamp} createdAt - Booking creation timestamp
 */
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

  // ===== Approval Workflow Metadata =====
  // Tracks approvals through the workflow chain
  
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

/**
 * Authorization record for approvers in the workflow
 * Defines roles and access permissions
 * @interface Approver
 * @property {string} email - Approver's email address
 * @property {"hod"|"staff"|"principal"} role - Role in approval workflow
 * @property {string} [department] - Associated department (for HOD)
 * @property {string} [resourceId] - Associated resource (for staff)
 * @property {boolean} isActive - Whether this approver is currently enabled
 */
export interface Approver {
  email: string;
  role: "hod" | "staff" | "principal";
  department?: string;
  resourceId?: string;
  isActive: boolean;
}
