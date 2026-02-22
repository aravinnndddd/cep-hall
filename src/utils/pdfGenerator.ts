import { jsPDF } from "jspdf";
import { Booking } from "../types";
import { format } from "date-fns";

export const generateRequestLetter = async (booking: Booking) => {
  const doc = new jsPDF();
  const margin = 20;
  let y = 30;

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("COLLEGE RESOURCE BOOKING REQUEST", 105, y, { align: "center" });
  
  y += 20;
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Date: ${format(new Date(), "dd/MM/yyyy")}`, margin, y);
  
  y += 15;
  doc.text("To,", margin, y);
  y += 7;
  doc.text("The Principal / Administrative Officer,", margin, y);
  y += 7;
  doc.text("College Campus.", margin, y);

  y += 15;
  doc.setFont("helvetica", "bold");
  doc.text(`Subject: Request for booking ${booking.resourceName}`, margin, y);

  y += 15;
  doc.setFont("helvetica", "normal");
  const bodyText = `Respected Sir/Madam,

I am writing to formally request the booking of ${booking.resourceName} for the event "${booking.eventName}" organized by the ${booking.department} department.

The event details are as follows:
- Date: ${booking.date}
- Time: ${booking.startTime} to ${booking.endTime}
- Expected Participants: ${booking.participants}
- Purpose: ${booking.purpose}
- Equipment Required: ${booking.equipment || "None"}

We assure you that the resource will be used responsibly and all college guidelines will be followed during the event. We request you to kindly grant us permission for the same.

Thanking you,`;

  const splitText = doc.splitTextToSize(bodyText, 170);
  doc.text(splitText, margin, y);
  
  y += splitText.length * 7 + 10;

  // Signatures
  doc.text("Yours faithfully,", margin, y);
  y += 10;
  
  doc.setFontSize(10);
  doc.text(`Digitally Signed by: ${booking.organizerName}`, margin, y);
  doc.text(`Email: ${booking.userId}@college.edu`, margin, y + 5); // Fallback if no email in booking
  
  y += 20;
  doc.setFontSize(12);
  doc.text(`${booking.organizerName}`, margin, y);
  doc.text(`(Organizer, ${booking.department})`, margin, y + 7);

  // Approval Section
  y = 220;
  doc.setFont("helvetica", "bold");
  doc.text("APPROVAL STATUS", margin, y);
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const approvals = [
    { label: "HOD Approval", approved: booking.hodApproved, email: booking.hodEmail, date: booking.hodApprovedAt },
    { label: "Staff Approval", approved: booking.staffApproved, email: booking.staffEmail, date: booking.staffApprovedAt },
    { label: "Principal Approval", approved: booking.principalApproved, email: booking.principalEmail, date: booking.principalApprovedAt },
  ];

  approvals.forEach((app) => {
    const status = app.approved ? "APPROVED" : "PENDING";
    const dateStr = app.date ? format(app.date.toDate(), "dd/MM/yyyy HH:mm") : "-";
    doc.text(`${app.label}: ${status}`, margin, y);
    if (app.approved) {
      doc.text(`By: ${app.email} on ${dateStr}`, margin + 80, y);
    }
    y += 7;
  });

  doc.save(`Request_Letter_${booking.eventName.replace(/\s+/g, "_")}.pdf`);
};
