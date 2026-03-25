/**
 * @file pdfGenerator.ts
 * @description Generates PDF documents for approved booking requests.
 * Creates formal letter documents suitable for institutional records and filing.
 */

import { jsPDF } from "jspdf";
import { Booking } from "../types";
import { format } from "date-fns";

/**
 * Generate a formal booking request letter as PDF
 *
 * Creates a professional letter document containing:
 * - Header with institution details
 * - Address and date
 * - Event details and requirements
 * - Digital signature information
 * - Footer with institution seal placeholder
 *
 * The PDF can be printed or stored as institutional record.
 *
 * @async
 * @param {Booking} booking - The booking object to generate letter for
 * @returns {Promise<void>}
 *
 * @example
 * const booking = bookingData;
 * await generateRequestLetter(booking);
 * // Browser will open PDF download dialog
 */
export const generateRequestLetter = async (booking: Booking) => {
  const doc = new jsPDF();
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const lineHeight = 7;
  let y = 25;

  // ===== Header =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("COLLEGE RESOURCE BOOKING REQUEST", pageWidth / 2, y, {
    align: "center",
  });

  y += 10;
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y); // underline

  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Date: ${format(new Date(), "dd/MM/yyyy")}`, pageWidth - margin, y, {
    align: "right",
  });

  // ===== Address =====
  y += 12;
  doc.text("To,", margin, y);
  y += lineHeight;
  doc.text("The Principal / Administrative Officer,", margin, y);
  y += lineHeight;
  doc.text("College Campus.", margin, y);

  // ===== Subject =====
  y += 12;
  doc.setFont("helvetica", "bold");
  doc.text(
    `Subject: Request for booking of ${booking.resourceName}`,
    margin,
    y
  );

  // ===== Body =====
  y += 10;
  doc.setFont("helvetica", "normal");

  const bodyText = `Respected Sir/Madam,

I request permission to book the ${booking.resourceName} for the event "${booking.eventName}" organized by the ${booking.department} department.

Event Details:
Date: ${booking.date}
Time: ${booking.startTime} - ${booking.endTime}
Participants: ${booking.participants}
Purpose: ${booking.purpose}
Equipment: ${booking.equipment || "None"}

We assure responsible usage and adherence to all college rules. Kindly grant permission for the above request.

Thanking you.`;

  const splitBody = doc.splitTextToSize(bodyText, pageWidth - margin * 2);
  doc.text(splitBody, margin, y);
  y += splitBody.length * lineHeight + 10;

  // ===== Signature =====
  doc.text("Yours faithfully,", margin, y);
  y += lineHeight * 2;

  doc.setFontSize(10);
  doc.text(`Digitally Signed by: ${booking.organizerName}`, margin, y);
  y += lineHeight;
  doc.text(`Email: ${booking.userId}@college.edu`, margin, y);

  y += lineHeight * 2;
  doc.setFontSize(11);
  doc.text(booking.organizerName, margin, y);
  y += lineHeight;
  doc.text(`Organizer, ${booking.department}`, margin, y);

  // ===== Approval Section =====
  y += 15;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Approval Status", margin, y);

  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const approvals = [
    {
      label: "HOD",
      approved: booking.hodApproved,
      email: booking.hodEmail,
      date: booking.hodApprovedAt,
    },
    {
      label: "Staff",
      approved: booking.staffApproved,
      email: booking.staffEmail,
      date: booking.staffApprovedAt,
    },
    {
      label: "Principal",
      approved: booking.principalApproved,
      email: booking.principalEmail,
      date: booking.principalApprovedAt,
    },
  ];

  approvals.forEach((app) => {
    const status = app.approved ? "APPROVED" : "PENDING";
    const dateStr = app.date
      ? format(app.date.toDate(), "dd/MM/yyyy HH:mm")
      : "-";

    // Left column
    doc.text(`${app.label}: ${status}`, margin, y);

    // Right column (aligned)
    if (app.approved) {
      doc.text(`By: ${app.email}`, pageWidth / 2, y);
      y += lineHeight;
      doc.text(`On: ${dateStr}`, pageWidth / 2, y);
    }

    y += lineHeight + 2;
  });

  // ===== Save =====
  doc.save(
    `Request_Letter_${booking.eventName.replace(/\s+/g, "_")}.pdf`
  );
};