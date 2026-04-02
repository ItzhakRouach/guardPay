import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { formatDate } from "./utils";

export const handleGeneratePDF = async (
  totals,
  profile,
  selectedMonth,
  shifts,
  monthlyReport,
) => {
  const getRate = (s) => Number(s.base_rate || profile.price_per_hour || 0);
  const baseRideRate = profile.price_per_ride;
  const baseRate = Number(profile.price_per_hour);
  const dayoffAndTrainingRate = 8 * baseRate;

  const groupedRows = {};

  shifts.forEach((s) => {
    const rate = getRate(s);

    // מיפוי כל סוגי השעות האפשריים מה-Database החדש
    const hourTypes = [
      { key: "h100_hours", label: "שעות רגילות 100%", factor: 1 },
      { key: "h125_extra_hours", label: "שעות נוספות 125%", factor: 1.25 },
      { key: "h150_extra_hours", label: "שעות נוספות 150%", factor: 1.5 },
      // שבת
      { key: "h150_shabat", label: "שעות שבת 150%", factor: 1.5 },
      { key: "h175_shabat", label: "שעות נוספות שבת 175%", factor: 1.75 },
      { key: "h200_shabat", label: "שעות נוספות שבת 200%", factor: 2 },
      // חג
      { key: "h150_holiday", label: "שעות חג 150%", factor: 1.5 },
      { key: "h175_holiday", label: "שעות נוספות חג 175%", factor: 1.75 },
      { key: "h200_holiday", label: "שעות נוספות חג 200%", factor: 2 },
    ];

    hourTypes.forEach((type) => {
      const hours = Number(s[type.key] || 0);
      if (hours > 0) {
        const finalRate = (rate * type.factor).toFixed(2);
        // איחוד שורות לפי סוג השעה והתעריף
        const groupKey = `${type.label}_${finalRate}`;

        if (!groupedRows[groupKey]) {
          groupedRows[groupKey] = {
            label: type.label,
            hours: 0,
            rate: finalRate,
          };
        }
        groupedRows[groupKey].hours += hours;
      }
    });
  });

  const rows = Object.values(groupedRows)
    .map(
      (group) => `
    <tr>
      <td>${group.label}</td>
      <td>₪${group.rate}</td>
      <td>${group.hours.toFixed(2)}</td>
      <td>₪${(group.hours * group.rate).toFixed(2)}</td>
    </tr>
  `,
    )
    .join("");

  const travelRow =
    totals.travelPay > 0
      ? `
    <tr style="background-color: #fafafa; font-weight: bold;">
      <td>נסיעות</td>
      <td>₪${baseRideRate}</td>
      <td>${totals.travelCount}</td>
      <td>₪${totals.travelPay.toFixed(2)}</td>
    </tr>
  `
      : "";

  const trainingRow =
    totals.trainingAmount > 0
      ? `
    <tr style="background-color: #fafafa; font-weight: bold;">
      <td>ימי רענון</td>
      <td>₪${dayoffAndTrainingRate}</td>
      <td>${totals.trainingDays}</td>
      <td>₪${totals.trainingAmount.toFixed(2)}</td>
    </tr>
  `
      : "";

  const vacationRow =
    totals.vacationAmount > 0
      ? `
    <tr style="background-color: #fafafa; font-weight: bold;">
      <td>ימי חופש</td>
      <td>₪${dayoffAndTrainingRate}</td>
      <td>${totals.vacationDays}</td>
      <td>₪${totals.vacationAmount.toFixed(2)}</td>
    </tr>
  `
      : "";

  // רכיבי הזיכויים (בירוק)
  const settlementCreditRow =
    monthlyReport?.settlementBenefit > 0
      ? `
    <tr>
      <td style="color: #2e7d32;">זיכוי יישוב מוטב (${profile.settlement_percent}%)</td>
      <td style="color: #2e7d32; font-weight: bold;">- ₪${monthlyReport.settlementBenefit.toFixed(2)}</td>
    </tr>
  `
      : "";

  const creditPointsRow = `
    <tr>
      <td style="color: #2e7d32;">זיכוי נקודות זיכוי (${profile.credit_points || 2.25})</td>
      <td style="color: #2e7d32; font-weight: bold;">- ₪${((profile.credit_points || 2.25) * 242).toFixed(2)}</td>
    </tr>
  `;

  const htmlStyles = `
    <style>
      body { font-family: Arial, sans-serif; direction: rtl; padding: 20px; color: #333; }
      .header-container { border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin-bottom: 20px; background-color: #fafafa; }
      .header-row { display: flex; flex-direction: row; margin-bottom: 8px; border-bottom: 1px solid #e0e0e0; padding-bottom: 5px; }
      .label { font-weight: bold; width: 140px; color: #555; text-align: right; }
      .payroll-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      .payroll-table th { background-color: #f2f2f2; text-align: right; padding: 10px; border-bottom: 2px solid #4a69ff; }
      .payroll-table td { padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; font-size: 14px; }
      .section-title { font-size: 18px; color: #333; border-right: 4px solid #4a69ff; padding-right: 10px; margin-top: 30px; margin-bottom: 10px; }
      .summary-section { margin-top: 40px; padding: 20px; background-color: #f8f9fa; border-radius: 12px; border: 1px solid #e0e0e0; }
      .summary-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
      .summary-row.net { font-size: 24px; color: #4a69ff; font-weight: 900; margin-top: 15px; border-top: 2px solid #4a69ff; padding-top: 10px; }
    </style>
  `;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
    <head><meta charset="UTF-8">${htmlStyles}</head>
    <body>
      <div class="header-container">
        <div class="header-row"><span class="label">שם עובד:</span><span>${profile.user_name}</span></div>
        <div class="header-row"><span class="label">חודש:</span><span>${formatDate(selectedMonth)}</span></div>
        <div class="header-row"><span class="label">כמות שעות:</span><span>${totals.totalHours.toFixed(2)}</span></div>
        <div class="header-row"><span class="label">כמות משמרות:</span><span>${totals.totalShifts}</span></div>
      </div>

      <table class="payroll-table">
        <thead>
          <tr><th>רכיב</th><th>תעריף</th><th>כמות</th><th>סכום</th></tr>
        </thead>
        <tbody>
          ${rows}
          ${travelRow}
          ${vacationRow}
          ${trainingRow}
        </tbody>
      </table>

      <h3 class="section-title">ניכויים וזיכויים</h3>
      <table class="payroll-table">
        <tbody>
          ${creditPointsRow}
          ${settlementCreditRow}
          <tr><td>מס הכנסה (לאחר זיכויים)</td><td>₪${(monthlyReport?.incomeTax || 0).toFixed(2)}</td></tr>
          <tr><td>ביטוח לאומי ובריאות</td><td>₪${(monthlyReport?.bituahLeumiAndHealth || 0).toFixed(2)}</td></tr>
          <tr><td>פנסיה (תגמולי עובד)</td><td>₪${(monthlyReport?.pensia || 0).toFixed(2)}</td></tr>
        </tbody>
      </table>

      <div class="summary-section">
        <div class="summary-row"><span>סה"כ ברוטו:</span><span>₪ ${(monthlyReport?.bruto || 0).toFixed(2)}</span></div>
        <div class="summary-row"><span>סה"כ ניכויים:</span><span>₪ ${(monthlyReport?.totalDeductions || 0).toFixed(2)}</span></div>
        <div class="summary-row net"><span>נטו לתשלום:</span><span>₪ ${(monthlyReport?.neto || 0).toFixed(2)}</span></div>
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
