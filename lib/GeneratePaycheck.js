import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { formatDate } from "./utils";

export const handleGeneratePDF = async (totals, profile, selectedMonth) => {
  const baseRate = profile.price_per_hour; // Dynamic base rate from user preferences
  const baseRideRate = profile.price_per_ride;

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
      font-size: 14px;
    }

    /* הדגשה של עמודת הסכום */
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

  // Building the tables rows
  const rows = [];
  if (totals.h100 > 0)
    rows.push(
      `<tr><td>שעות רגילות 100%</td><td>${
        totals.h100
      }</td><td>${baseRate}</td><td>${(totals.h100 * baseRate).toFixed(
        2
      )}</td></tr>`
    );
  if (totals.h150s > 0)
    rows.push(
      `<tr><td>שעות שבת 150%</td><td>${totals.h150s}</td><td>${(
        baseRate * 1.5
      ).toFixed(2)}</td><td>${(totals.h150s * baseRate * 1.5).toFixed(
        2
      )}</td></tr>`
    );
  if (totals.h125e > 0)
    rows.push(
      `<tr><td>נוספות 125%</td><td>${totals.h125e}</td><td>${(
        baseRate * 1.25
      ).toFixed(2)}</td><td>${(totals.h125e * baseRate * 1.25).toFixed(
        2
      )}</td></tr>`
    );
  if (totals.h150e > 0)
    rows.push(
      `<tr><td>נוספות 150%</td><td>${totals.h150e}</td><td>${(
        baseRate * 1.5
      ).toFixed(2)}</td><td>${(totals.h150e * baseRate * 1.5).toFixed(
        2
      )}</td></tr>`
    );
  if (totals.h175s > 0)
    rows.push(
      `<tr><td>נוספות שבת 175%</td><td>${totals.h175s}</td><td>${(
        baseRate * 1.75
      ).toFixed(2)}</td><td>${(totals.h175s * baseRate * 1.75).toFixed(
        2
      )}</td></tr>`
    );
  if (totals.h200s > 0)
    rows.push(
      `<tr><td>נוספות שבת 200%</td><td>${totals.h200s}</td><td>${(
        baseRate * 2
      ).toFixed(2)}</td><td>${(totals.h200s * baseRate * 2).toFixed(
        2
      )}</td></tr>`
    );
  if (totals.monthlyTravelPay > 0)
    rows.push(
      `<tr><td>נסיעות</td><td>${
        totals.travelCount
      }</td><td>${baseRideRate}</td><td>${totals.monthlyTravelPay.toFixed(
        2
      )}</td></tr>`
    );

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
      <table class="payroll-table">
        <thead><tr><th>רכיב</th><th>כמות</th><th>תעריף</th><th>סכום</th></tr></thead>
        <tbody>${rows.join("")}</tbody>
      </table>
      <h3 class="section-title">ניכויים</h3>
      <table class="payroll-table">
        <tbody>
          <tr><td>מס הכנסה</td><td>${totals.monthlyReport.incomeTax.toFixed(
            2
          )}</td></tr>
          <tr><td>ביטוח לאומי ובריאות</td><td>${totals.monthlyReport.bituahLeumiAndHealth.toFixed(
            2
          )}</td></tr>
          <tr><td>פנסיה</td><td>${totals.monthlyReport.pensia.toFixed(
            2
          )}</td></tr>
        </tbody>
      </table>
      <div class="summary-section">
        <div class="summary-row"><span>סה"כ ברוטו:</span><span>₪ ${totals.monthlyReport.bruto.toFixed(
          2
        )}</span></div>
        <div class="summary-row net"><span>נטו לתשלום:</span><span class="summary-value">₪ ${totals.monthlyReport.neto.toFixed(
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
