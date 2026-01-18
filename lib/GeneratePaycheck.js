import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { formatDate } from "./utils";

export const handleGeneratePDF = async (
  totals,
  profile,
  selectedMonth,
  shifts,
  monthlyReport
) => {
  const getRate = (s) => Number(s.base_rate || profile.price_per_hour || 0);
  const baseRideRate = profile.price_per_ride;
  const baseRate = Number(profile.price_per_hour);
  const dayoffAndTrainingRate = 8 * baseRate;

  const groupedRows = {};
  shifts.forEach((s) => {
    const rate = getRate(s);

    const hourTypes = [
      {
        key: "h100",
        label: "שעות רגילות 100%",
        hours: Number(s.h100_hours),
        factor: 1,
      },
      {
        key: "h150s",
        label: "שעות שבת 150%",
        hours: Number(s.h150_shabat),
        factor: 1.5,
      },
      {
        key: "h125e",
        label: "שעות נוספות 125%",
        hours: Number(s.h125_extra_hours),
        factor: 1.25,
      },
      {
        key: "h150e",
        label: "שעות נוספות 150%",
        hours: Number(s.h150_extra_hours),
        factor: 1.5,
      },
      {
        key: "h175s",
        label: "שעות נוספות שבת 175%",
        hours: Number(s.h175_extra_hours),
        factor: 1.75,
      },
      {
        key: "h200s",
        label: "שעות נוספות שבת 200%",
        hours: Number(s.h200_extra_hours),
        factor: 2,
      },
    ];
    hourTypes.forEach((type) => {
      if (type.hours > 0) {
        const finalRate = (rate * type.factor).toFixed(2);
        const groupKey = `${type.key}_${finalRate}`;

        if (!groupedRows[groupKey]) {
          groupedRows[groupKey] = {
            label: type.label,
            hours: 0,
            rate: finalRate,
          };
        }
        groupedRows[groupKey].hours += type.hours;
      }
    });
  });

  const rows = Object.values(groupedRows)
    .map(
      (group) => `
    <tr>
      <td>${group.label}</td>
      <td>${group.rate}</td>
      <td>${group.hours.toFixed(2)}</td>
      <td>${(group.hours * group.rate).toFixed(2)}</td>
    </tr>
  `
    )
    .join("");

  const travelRow =
    totals.travelPay > 0
      ? `
    <tr style="background-color: #fafafa; font-weight: bold;">
      <td>נסיעות</td>
      <td>${baseRideRate}</td>
      <td>${totals.travelCount}</td>
      <td>${totals.travelPay.toFixed(2)}</td>
    </tr>
  `
      : "";

  const trainingRow =
    totals.trainingAmount > 0
      ? `
    <tr style="background-color: #fafafa; font-weight: bold;">
      <td>ימי רענון</td>
      <td>${dayoffAndTrainingRate}</td>
      <td>${totals.trainingDays}</td>
      <td>${totals.trainingAmount.toFixed(2)}</td>
    </tr>
  `
      : "";

  const vacationRow =
    totals.vacationAmount > 0
      ? `
    <tr style="background-color: #fafafa; font-weight: bold;">
      <td>ימי חופש</td>
      <td>${dayoffAndTrainingRate}</td>
      <td>${totals.vacationDays}</td>
      <td>${totals.vacationAmount.toFixed(2)}</td>
    </tr>
  `
      : "";

  const htmlStyles = `
    <style>
         body {
      font-family: Arial, Helvetica, sans-serif;
      direction: rtl;
      padding: 20px;
      color: #333;
      background-color: #fff;
    }

    .header-container {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 20px;
      background-color: #fafafa;
      padding-bottom: 5px;
    }

    .header-row {
      display: flex;
      flex-direction: row;
      margin-bottom: 8px;
      border-bottom: 1px solid #e0e0e0;
    }
    .header-row:last-child {
      border-bottom: none;
    }

    .label {
      font-weight: bold;
      width: 120px; 
      color: #555;
      text-align: right;
    }

    .value {
      color: #000;
      flex: 1;
      text-align: right;
      padding-right: 10px;
    }

    
    .month-highlight {
      font-size: 1.1em;
      color: #4a69ff; 
      font-weight: 600;
    }
    .payroll-table {
      width: 100%;
      border-collapse: collapse; 
      margin-top: 20px;
      direction: rtl;
    }

    .payroll-table th {
      background-color: #f2f2f2; 
      color: #333;
      text-align: right;
      padding: 10px;
      border-bottom: 2px solid #4a69ff; 
      font-weight: bold;
    }

    .payroll-table td {
      padding: 10px;
      border-bottom: 1px solid #eee;
      text-align: right;
      font-weight: bold;
      font-size: 14px;
    }

    .payroll-table td:last-child {
      font-weight: 600;
    }

    
    .payroll-table tbody tr:nth-child(even) {
      background-color: #fafafa;
    }
  
    .section-title {
      font-size: 18px;
      color: #333;
      border-right: 4px solid #e94560; 
      padding-right: 10px;
      margin-top: 30px;
      margin-bottom: 10px;
    }

   
    .deductions-table th {
      border-bottom: 2px solid #e94560; 
    }

    
    .deductions-table td:last-child {
      color: #d32f2f; 
    }
    .summary-section {
      margin-top: 40px;
      padding: 20px;
      background-color: #f8f9fa;
      border-radius: 12px;
      border: 1px solid #e0e0e0;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .summary-row.gross {
      border-bottom: 1px dashed #ccc;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }

    .summary-label {
      font-size: 16px;
      color: #666;
      font-weight: 500;
    }

    .summary-value {
      font-size: 18px;
      color: #333;
      font-weight: bold;
    }

    
    .summary-row.net {
      margin-top: 5px;
    }

    .summary-row.net .summary-label {
      font-size: 20px;
      color: #000;
      font-weight: 800;
    }

    .summary-row.net .summary-value {
      font-size: 28px;
      color: #4a69ff; 
      font-weight: 900;
    }
    </style>
  `;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
    <head><meta charset="UTF-8">${htmlStyles}</head>
    <body>
      <div class="header-container">
        <div class="header-row"><span class="label">שם עובד:</span><span>${
          profile.user_name
        }</span></div>
        <div class="header-row"><span class="label">חודש:</span><span>${formatDate(
          selectedMonth
        )}</span></div>
      </div>
      <div class="header-row"><span class="label">כמות שעות:</span><span>${
        totals.totalHours
      }</span></div>
      </div>
      <div class="header-row"><span class="label">כמות משמרות:</span><span>${
        totals.totalShifts
      }</span></div>
      </div>
      <table class="payroll-table">
        <thead><tr><th>רכיב</th><th>תעריף</th><th>כמות</th><th>סכום</th></tr></thead>
        <tbody>${travelRow}</tbody>
        <tbody>${vacationRow}</tbody>
        <tbody<${trainingRow}</tbody>
        <tbody>${rows}</tbody>
      </table>
      <h3 class="section-title">ניכויים</h3>
      <table class="payroll-table">
        <tbody>
          <tr><td>מס הכנסה</td><td>${monthlyReport.incomeTax.toFixed(
            2
          )}</td></tr>
          <tr><td>ביטוח לאומי ובריאות</td><td>${monthlyReport.bituahLeumiAndHealth.toFixed(
            2
          )}</td></tr>
          <tr><td>פנסיה</td><td>${monthlyReport.pensia.toFixed(2)}</td></tr>
        </tbody>
      </table>
      <div class="summary-section">
        <div class="summary-row"><span>סה"כ ברוטו:</span><span>₪ ${monthlyReport.bruto.toFixed(
          2
        )}</span></div>
        <div class="summary-row net"><span>נטו לתשלום:</span><span class="summary-value">₪ ${monthlyReport.neto.toFixed(
          2
        )}</span></div>
      </div>
    </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    await Sharing.shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" });
  } catch (error) {
    console.error("Failed to generate PDF", error);
  }
};
