import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Generates a professional, multi-page PDF Travel Report for TripNest.
 * 
 * Page 1: Cover / Trip Information
 * Page 2+: Trip Itinerary (Day-wise)
 * Page N+: Expense Report (Summary, Category Breakdown, Expense Details)
 * Page Final: Dedicated Thank You Page
 */
export const generateTripReportPDF = ({ trip, itineraries = [], expenses = [] }) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const marginX = 15;
  const contentWidth = pageWidth - marginX * 2; // 180mm
  const headerMargin = 25; // Safe top content start
  const footerMargin = 28; // Safe bottom content limit
  const maxY = pageHeight - footerMargin; // 269mm

  // Professional Color Palette
  const primaryColor = [124, 58, 237]; // #7c3aed (Violet)
  const primaryDark = [109, 40, 217]; // #6d28d9 (Deep Violet)
  const textDark = [15, 23, 42]; // #0f172a (Slate 900)
  const textMuted = [100, 116, 139]; // #64748b (Slate 500)
  const lightBg = [248, 250, 252]; // #f8fafc (Slate 50)
  const cardBorder = [226, 232, 240]; // #e2e8f0 (Slate 200)
  const headerBannerBg = [243, 232, 255]; // #f3e8ff (Light Purple)

  // ==================== HELPER FORMATTERS ====================
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateWithWeekday = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "N/A";
    const formattedDate = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
    return `${formattedDate} (${weekday})`;
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(Number(amount))) return "N/A";
    return `INR ${Number(amount).toLocaleString()}`;
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      UPCOMING: "Upcoming",
      PLANNING: "Planning",
      ONGOING: "Ongoing",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
    };
    return statusMap[status] || status || "N/A";
  };

  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return "N/A";
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return "N/A";
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Including start and end day
    return `${diffDays} Day${diffDays > 1 ? "s" : ""}`;
  };

  const generateReportId = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `TR-${year}${month}${day}-${trip?.id || "NA"}`;
  };

  // Owner information from backend / trip object
  const ownerName = trip?.ownerName || "Traveler";
  const ownerEmail = trip?.ownerEmail || "N/A";

  // ==================== 1. PAGE 1: COVER / TRIP INFORMATION ====================
  // Top Accent Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 6, "F");

  // Subtle background watermark emblem / logo text
  doc.setFontSize(70);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(243, 232, 255);
  doc.text("TripNest", pageWidth / 2, 170, { align: "center" });

  // Branding Title
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryDark);
  doc.text("TripNest", marginX, 26);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textMuted);
  doc.text("TRAVEL REPORT", marginX, 33);

  // Divider Line
  doc.setDrawColor(...cardBorder);
  doc.setLineWidth(0.5);
  doc.line(marginX, 38, pageWidth - marginX, 38);

  // Prepared For Card
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...cardBorder);
  doc.roundedRect(marginX, 44, contentWidth, 28, 3, 3, "FD");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryColor);
  doc.text("PREPARED FOR", marginX + 8, 52);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textDark);
  doc.text(ownerName, marginX + 8, 60);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textMuted);
  doc.text(ownerEmail !== "N/A" ? ownerEmail : "Email not specified", marginX + 8, 67);

  // Trip Overview Heading
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textDark);
  doc.text("Trip Information", marginX, 81);

  const coverDetails = [
    ["Trip Name", trip?.title || "N/A"],
    ["Destination", trip?.destination || "N/A"],
    ["Start Date", formatDate(trip?.startDate)],
    ["End Date", formatDate(trip?.endDate)],
    ["Duration", calculateDuration(trip?.startDate, trip?.endDate)],
    ["Travelers", `${trip?.numberOfTravelers || 1} Person(s)`],
    ["Status", getStatusBadge(trip?.status)],
    ["Total Budget", formatCurrency(trip?.budget)],
    ["Report ID", generateReportId()],
    ["Generated On", formatDate(new Date().toISOString())],
  ];

  autoTable(doc, {
    startY: 85,
    head: [["Field", "Information"]],
    body: coverDetails,
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 4.5, textColor: textDark },
    headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: "bold", fontSize: 9.5 },
    alternateRowStyles: { fillColor: lightBg },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50, textColor: [71, 85, 105] },
      1: { cellWidth: "auto" },
    },
    margin: { left: marginX, right: marginX, top: headerMargin, bottom: footerMargin },
  });

  let coverY = doc.lastAutoTable.finalY + 8;
  if (trip?.description) {
    if (coverY + 25 <= maxY) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...textMuted);
      doc.text("Trip Description:", marginX, coverY);
      coverY += 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...textDark);
      const splitDesc = doc.splitTextToSize(trip.description, contentWidth);
      doc.text(splitDesc, marginX, coverY);
    }
  }

  // Cover Page Bottom Branding (within safe content area)
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textMuted);
  doc.text("TripNest • Smart Travel Planning", pageWidth / 2, pageHeight - 14, { align: "center" });

  // ==================== 2. PAGE 2+: DAY-WISE ITINERARY ====================
  doc.addPage();
  let currentY = headerMargin;

  // Section Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textDark);
  doc.text("Trip Itinerary", marginX, currentY);
  currentY += 6;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textMuted);
  doc.text("Day-by-day scheduled activities and itinerary plans", marginX, currentY);
  currentY += 6;

  // Divider Line
  doc.setDrawColor(...cardBorder);
  doc.setLineWidth(0.4);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 8;

  // Sort itineraries by date ascending
  const sortedItineraries = [...itineraries].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date) - new Date(b.date);
  });

  if (sortedItineraries.length === 0) {
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...textMuted);
    doc.text("No itinerary plans recorded for this trip.", marginX, currentY);
  } else {
    sortedItineraries.forEach((itinerary, index) => {
      // Ensure day header block doesn't start at bottom edge
      if (currentY + 25 > maxY) {
        doc.addPage();
        currentY = headerMargin;
      }

      const dayTitle = `Day ${index + 1} • ${formatDateWithWeekday(itinerary.date)}`;

      // Day Header Box
      doc.setFillColor(...headerBannerBg);
      doc.roundedRect(marginX, currentY, contentWidth, 8, 1, 1, "F");

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...primaryDark);
      doc.text(dayTitle, marginX + 4, currentY + 5.5);
      currentY += 11;

      if (itinerary.notes) {
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...textMuted);
        const splitNotes = doc.splitTextToSize(`Day Notes: ${itinerary.notes}`, contentWidth - 8);
        doc.text(splitNotes, marginX + 4, currentY);
        currentY += splitNotes.length * 4 + 3;
      }

      if (itinerary.activities && itinerary.activities.length > 0) {
        const activityRows = itinerary.activities.map((act) => {
          const timeRange =
            act.startTime && act.endTime
              ? `${act.startTime.substring(0, 5)} - ${act.endTime.substring(0, 5)}`
              : act.startTime
              ? act.startTime.substring(0, 5)
              : "All Day";

          const categoryName = act.type
            ? act.type.charAt(0) + act.type.slice(1).toLowerCase().replace(/_/g, " ")
            : "Activity";

          return [
            timeRange,
            act.title || "N/A",
            categoryName,
            act.location || "-",
            act.cost ? formatCurrency(act.cost) : "-",
            act.description || act.notes || "-",
          ];
        });

        autoTable(doc, {
          startY: currentY,
          head: [["Time", "Activity", "Category", "Location", "Cost", "Notes"]],
          body: activityRows,
          theme: "grid",
          headStyles: {
            fillColor: primaryColor,
            textColor: 255,
            fontStyle: "bold",
            fontSize: 8.5,
            cellPadding: 3,
          },
          styles: {
            fontSize: 8,
            cellPadding: 4,
            textColor: textDark,
            overflow: "linebreak",
          },
          alternateRowStyles: { fillColor: lightBg },
          columnStyles: {
            0: { cellWidth: 26, fontStyle: "bold", textColor: [71, 85, 105] },
            1: { cellWidth: 38, fontStyle: "bold" },
            2: { cellWidth: 25 },
            3: { cellWidth: 28 },
            4: { cellWidth: 22, halign: "right" },
            5: { cellWidth: "auto" },
          },
          margin: { top: headerMargin, bottom: footerMargin, left: marginX, right: marginX },
          showHead: "everyPage",
        });

        currentY = doc.lastAutoTable.finalY + 8;
      } else {
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(...textMuted);
        doc.text("No activities scheduled for this day.", marginX + 4, currentY);
        currentY += 8;
      }

      currentY += 4;
    });
  }

  // ==================== 3. PAGE N+: EXPENSE REPORT ====================
  doc.addPage();
  currentY = headerMargin;

  // Section Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textDark);
  doc.text("Expense Report", marginX, currentY);
  currentY += 6;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textMuted);
  doc.text("Financial summary and itemized expenses", marginX, currentY);
  currentY += 6;

  // Divider Line
  doc.setDrawColor(...cardBorder);
  doc.setLineWidth(0.4);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 8;

  // Expense Calculations
  const totalExpenses = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  const totalBudget = Number(trip?.budget) || 0;
  const remainingBudget = totalBudget - totalExpenses;
  const utilizationPercent = totalBudget > 0 ? Math.round((totalExpenses / totalBudget) * 100) : 0;

  // 1. Expense Summary Table
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textDark);
  doc.text("Expense Summary", marginX, currentY);
  currentY += 5;

  const summaryRows = [
    ["Total Budget", formatCurrency(totalBudget)],
    ["Total Spent", formatCurrency(totalExpenses)],
    [remainingBudget >= 0 ? "Remaining Budget" : "Over Budget", formatCurrency(Math.abs(remainingBudget))],
    ["Budget Utilization", `${utilizationPercent}%`],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [["Metric", "Amount / Percentage"]],
    body: summaryRows,
    theme: "grid",
    headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: "bold", fontSize: 9 },
    styles: { fontSize: 8.5, cellPadding: 4, textColor: textDark },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 100 },
      1: { halign: "right", fontStyle: "bold" },
    },
    margin: { top: headerMargin, bottom: footerMargin, left: marginX, right: marginX },
  });

  currentY = doc.lastAutoTable.finalY + 10;

  if (expenses.length > 0) {
    // 2. Category Breakdown Table
    if (currentY + 35 > maxY) {
      doc.addPage();
      currentY = headerMargin;
    }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...textDark);
    doc.text("Category-wise Breakdown", marginX, currentY);
    currentY += 5;

    const categoryTotals = expenses.reduce((acc, exp) => {
      const cat = exp.category
        ? exp.category.toUpperCase().replace(/_/g, " ")
        : "MISCELLANEOUS";
      if (!acc[cat]) acc[cat] = { count: 0, total: 0 };
      acc[cat].count += 1;
      acc[cat].total += Number(exp.amount) || 0;
      return acc;
    }, {});

    const categoryRows = Object.entries(categoryTotals).map(([cat, data]) => {
      const pct = totalExpenses > 0 ? Math.round((data.total / totalExpenses) * 100) : 0;
      return [cat, `${data.count} expense(s)`, formatCurrency(data.total), `${pct}%`];
    });

    autoTable(doc, {
      startY: currentY,
      head: [["Category", "Items", "Total Spent", "% of Total"]],
      body: categoryRows,
      theme: "grid",
      headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: "bold", fontSize: 9 },
      styles: { fontSize: 8.5, cellPadding: 4, textColor: textDark },
      alternateRowStyles: { fillColor: lightBg },
      columnStyles: {
        0: { fontStyle: "bold" },
        1: { halign: "center" },
        2: { halign: "right", fontStyle: "bold" },
        3: { halign: "right" },
      },
      margin: { top: headerMargin, bottom: footerMargin, left: marginX, right: marginX },
      showHead: "everyPage",
    });

    currentY = doc.lastAutoTable.finalY + 10;

    // 3. Detailed Expense Table
    if (currentY + 40 > maxY) {
      doc.addPage();
      currentY = headerMargin;
    }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...textDark);
    doc.text("Expense Details", marginX, currentY);
    currentY += 5;

    const expenseRows = expenses.map((exp) => [
      formatDate(exp.date),
      exp.title || "N/A",
      exp.category ? exp.category.replace(/_/g, " ") : "N/A",
      formatCurrency(exp.amount),
      exp.description || (exp.username ? `Paid by ${exp.username}` : "-"),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [["Date", "Expense Name", "Category", "Amount", "Description / Paid By"]],
      body: expenseRows,
      theme: "grid",
      headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: "bold", fontSize: 8.5 },
      styles: { fontSize: 8, cellPadding: 4, textColor: textDark, overflow: "linebreak" },
      alternateRowStyles: { fillColor: lightBg },
      columnStyles: {
        0: { cellWidth: 25, fontStyle: "bold", textColor: [71, 85, 105] },
        1: { cellWidth: 45, fontStyle: "bold" },
        2: { cellWidth: 30 },
        3: { cellWidth: 25, halign: "right", fontStyle: "bold" },
        4: { cellWidth: "auto" },
      },
      margin: { top: headerMargin, bottom: footerMargin, left: marginX, right: marginX },
      showHead: "everyPage",
    });
  } else {
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...textMuted);
    doc.text("No individual expense entries recorded for this trip.", marginX, currentY + 5);
  }

  // ==================== 4. DEDICATED THANK YOU PAGE ====================
  doc.addPage();

  const thankYouBoxY = 80;

  // Card Background
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...cardBorder);
  doc.roundedRect(marginX + 15, thankYouBoxY, contentWidth - 30, 110, 4, 4, "FD");

  // Brand emblem / text
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryDark);
  doc.text("TripNest", pageWidth / 2, thankYouBoxY + 25, { align: "center" });

  // Separator line
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.6);
  doc.line(pageWidth / 2 - 25, thankYouBoxY + 33, pageWidth / 2 + 25, thankYouBoxY + 33);

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textDark);
  doc.text("Thank You!", pageWidth / 2, thankYouBoxY + 47, { align: "center" });

  // Messages
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text(
    "Thank you for planning your journey with TripNest.",
    pageWidth / 2,
    thankYouBoxY + 62,
    { align: "center" }
  );

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryColor);
  doc.text("Have a wonderful and safe journey!", pageWidth / 2, thankYouBoxY + 75, {
    align: "center",
  });

  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...textMuted);
  doc.text("See you on your next adventure.", pageWidth / 2, thankYouBoxY + 88, {
    align: "center",
  });

  // ==================== GLOBAL HEADER AND FOOTER PASS ====================
  const totalPages = doc.internal.getNumberOfPages();
  const generatedDate = formatDate(new Date().toISOString());

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    if (i === 1) {
      // Update cover page total count
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...textMuted);
      doc.text(`Page 1 of ${totalPages}`, pageWidth / 2, pageHeight - 9, { align: "center" });
    } else {
      // Running Header (Pages >= 2)
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...primaryColor);
      doc.text("TripNest Travel Report", marginX, 15);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...textMuted);
      const headerRightText = `${trip?.title || "Trip Report"}${
        trip?.destination ? " • " + trip.destination : ""
      }`;
      doc.text(headerRightText, pageWidth - marginX, 15, { align: "right" });

      // Header Separator Line
      doc.setDrawColor(...cardBorder);
      doc.setLineWidth(0.4);
      doc.line(marginX, 19, pageWidth - marginX, 19);

      // Running Footer (Pages >= 2)
      // Footer Separator Line
      doc.setDrawColor(...cardBorder);
      doc.setLineWidth(0.4);
      doc.line(marginX, pageHeight - 18, pageWidth - marginX, pageHeight - 18);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...textMuted);

      // Left: Generated by TripNest
      doc.text("Generated by TripNest", marginX, pageHeight - 10);

      // Center: Page X of Y
      doc.setFont("helvetica", "bold");
      doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: "center" });

      // Right: Generated On: Date
      doc.setFont("helvetica", "normal");
      doc.text(`Generated On: ${generatedDate}`, pageWidth - marginX, pageHeight - 10, {
        align: "right",
      });
    }
  }

  const safeFilename = (trip?.title || "trip")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  doc.save(`${safeFilename}-report.pdf`);
  return doc;
};
