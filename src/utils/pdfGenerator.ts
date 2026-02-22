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
  
  if (booking.organizerSignatureUrl) {
    try {
      doc.addImage(booking.organizerSignatureUrl, "PNG", margin, y, 40, 20);
    } catch (e) {
      console.error("Error adding organizer signature to PDF", e);
    }
  }
  
  y += 25;
  doc.text(`${booking.organizerName}`, margin, y);
  doc.text(`(Organizer, ${booking.department})`, margin, y + 7);

  // Admin Approval Section
  if (booking.status === "approved") {
    y = 240;
    doc.setFont("helvetica", "bold");
    doc.text("OFFICE USE ONLY - APPROVED", margin, y);
    y += 10;
    if (booking.adminSignatureUrl) {
      try {
        doc.addImage(booking.adminSignatureUrl, "PNG", margin, y, 40, 20);
      } catch (e) {
        console.error("Error adding admin signature to PDF", e);
      }
    }
    y += 25;
    doc.setFont("helvetica", "normal");
    doc.text("Authorized Signatory", margin, y);
  }

  doc.save(`Request_Letter_${booking.eventName.replace(/\s+/g, "_")}.pdf`);
};
