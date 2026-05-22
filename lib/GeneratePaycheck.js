import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { formatDate } from "./utils";

const BL_RATIO = 0.482;
const HEALTH_RATIO = 1 - BL_RATIO;
const PENSIA_REG_RATE = 0.07;
const PENSIA_EXTRA_RATE = 0.07;
const PENSIA_TRAVEL_RATE = 0.05;

const fmt = (n) =>
  Number(n || 0).toLocaleString("he-IL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const escape = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// The salary calculator emits 150%/175%/200% special-pay hours into a
// single set of fields (h150_shabat, h175_extra_hours, h200_extra_hours)
// regardless of weekend vs holiday — the shift's is_holiday flag is what
// distinguishes them. The PDF picks the label based on that flag so a
// month with both kinds gets two separate rows.
const HOUR_TYPES = [
  { key: "h100_hours", label: "שעות רגילות 100%", factor: 1 },
  { key: "h125_extra_hours", label: "שעות נוספות 125%", factor: 1.25 },
  { key: "h150_extra_hours", label: "שעות נוספות 150%", factor: 1.5 },
  {
    key: "h150_shabat",
    label: "שעות שבת 150%",
    holidayLabel: "שעות חג 150%",
    factor: 1.5,
  },
  {
    key: "h175_extra_hours",
    label: "שעות נוספות שבת 175%",
    holidayLabel: "שעות נוספות חג 175%",
    factor: 1.75,
  },
  {
    key: "h200_extra_hours",
    label: "שעות נוספות שבת 200%",
    holidayLabel: "שעות נוספות חג 200%",
    factor: 2,
  },
];

const aggregateEarnings = (shifts, profile) => {
  const groups = {};
  let bruto_regular = 0;
  let bruto_extra = 0;

  shifts.forEach((s) => {
    const rate = Number(s.base_rate || profile.price_per_hour || 0);
    const isHoliday = !!s.is_holiday;
    HOUR_TYPES.forEach((type) => {
      const hours = Number(s[type.key] || 0);
      if (hours <= 0) return;
      const finalRate = rate * type.factor;
      const amount = hours * finalRate;
      const label =
        isHoliday && type.holidayLabel ? type.holidayLabel : type.label;
      const key = `${label}_${finalRate.toFixed(2)}`;
      if (!groups[key]) {
        groups[key] = { label, hours: 0, rate: finalRate, amount: 0 };
      }
      groups[key].hours += hours;
      groups[key].amount += amount;
      if (type.factor === 1) bruto_regular += amount;
      else bruto_extra += amount;
    });
  });

  return { groups: Object.values(groups), bruto_regular, bruto_extra };
};

export const handleGeneratePDF = async (
  totals,
  profile,
  selectedMonth,
  shifts,
  monthlyReport,
) => {
  const baseRideRate = Number(profile.price_per_ride || 0);
  const baseRate = Number(profile.price_per_hour || 0);
  const dayoffRate = 8 * baseRate;

  const { groups, bruto_regular, bruto_extra } = aggregateEarnings(shifts, profile);
  const bruto_travel = Number(totals.travelPay || 0);
  const bruto = Number(monthlyReport?.bruto || 0);
  const neto = Number(monthlyReport?.neto || 0);
  const totalDeductions = Number(monthlyReport?.totalDeductions || 0);
  const blAndHealth = Number(monthlyReport?.bituahLeumiAndHealth || 0);
  const pensiaTotal = Number(monthlyReport?.pensia || 0);
  const incomeTax = Number(monthlyReport?.incomeTax || 0);
  // Cloud function currently emits `settlementBenefit`; local calculator
  // emits `settlementBenefitValue`. Read both until the function is renamed.
  const settlementBenefit = Number(
    monthlyReport?.settlementBenefitValue ?? monthlyReport?.settlementBenefit ?? 0,
  );
  const creditPointsValue = (Number(profile.credit_points) || 2.25) * 242;

  const blAmount = blAndHealth * BL_RATIO;
  const healthAmount = blAndHealth * HEALTH_RATIO;

  let pensiaReg = bruto_regular * PENSIA_REG_RATE;
  let pensiaExtra = bruto_extra * PENSIA_EXTRA_RATE;
  let pensiaTravel = bruto_travel * PENSIA_TRAVEL_RATE;
  const pensiaLocalSum = pensiaReg + pensiaExtra + pensiaTravel;
  if (pensiaLocalSum > 0 && pensiaTotal > 0) {
    const scale = pensiaTotal / pensiaLocalSum;
    pensiaReg *= scale;
    pensiaExtra *= scale;
    pensiaTravel *= scale;
  }

  const earningsRows = groups
    .map(
      (g) => `
      <tr>
        <td class="num">${fmt(g.amount)}</td>
        <td class="num">${fmt(g.rate)}</td>
        <td class="num">${g.hours.toFixed(2)}</td>
        <td class="desc">${g.label}</td>
      </tr>`,
    )
    .join("");

  const extraRow = (label, qty, rate, amount) => `
    <tr class="extra">
      <td class="num">${fmt(amount)}</td>
      <td class="num">${fmt(rate)}</td>
      <td class="num">${qty}</td>
      <td class="desc">${label}</td>
    </tr>`;

  const travelRow =
    bruto_travel > 0
      ? extraRow("נסיעות", totals.travelCount, baseRideRate, bruto_travel)
      : "";
  const vacationRow =
    totals.vacationAmount > 0
      ? extraRow("ימי חופש", totals.vacationDays, dayoffRate, totals.vacationAmount)
      : "";
  const trainingRow =
    totals.trainingAmount > 0
      ? extraRow("ימי רענון", totals.trainingDays, dayoffRate, totals.trainingAmount)
      : "";

  // Sick days are bucketed by sick_percent (0 / 0.5 / 1.0) so the reader
  // sees exactly how many days were paid at each Israeli sick-law rate.
  const sickBuckets = { 0: { days: 0, amount: 0 }, 0.5: { days: 0, amount: 0 }, 1: { days: 0, amount: 0 } };
  shifts.forEach((s) => {
    if (!s.is_sick) return;
    const pct = Number(s.sick_percent || 0);
    const bucket = sickBuckets[pct] || sickBuckets[0];
    bucket.days += 1;
    bucket.amount += Number(s.total_amount || 0);
  });
  const sickRow = (pct, label) => {
    const b = sickBuckets[pct];
    if (b.days === 0) return "";
    return extraRow(label, b.days, dayoffRate * pct, b.amount);
  };
  const sickRows = [
    sickRow(0, "ימי מחלה 0%"),
    sickRow(0.5, "ימי מחלה 50%"),
    sickRow(1, "ימי מחלה 100%"),
  ].join("");

  const dedRow = (label, amount) => `
    <tr>
      <td class="num">${fmt(amount)}</td>
      <td class="desc">${label}</td>
    </tr>`;

  const pensiaRows = [
    pensiaReg > 0 ? dedRow("פנסיה מבטחים", pensiaReg) : "",
    pensiaExtra > 0 ? dedRow("פנסיה מבטחים ש.נ.", pensiaExtra) : "",
    pensiaTravel > 0 ? dedRow("פנסיה מבטחים נסיעות", pensiaTravel) : "",
  ].join("");

  const creditRows = `
    ${dedRow(`זיכוי נק' זיכוי (${(Number(profile.credit_points) || 2.25).toFixed(2)})`, -creditPointsValue)}
    ${settlementBenefit > 0 ? dedRow(`זיכוי יישוב מוטב (${profile.settlement_percent || 0}%)`, -settlementBenefit) : ""}
  `;

  const employerName = escape(profile.employer_name || "GuardPay");
  const employerAddress = escape(profile.employer_address || "");
  const employerTaxFile = escape(profile.employer_tax_file || "");
  const employeeName = escape(profile.user_name || "");
  const employeeNumber = escape(profile.employee_number || "—");
  const nationalId = escape(profile.national_id || "—");
  const department = escape(profile.department || "—");
  const address = escape(profile.address || "—");
  const vetek = escape(profile.vetek || "—");
  const grade = escape(profile.grade || "—");

  const monthLabel = escape(formatDate(selectedMonth));
  const generatedAt = new Date().toLocaleDateString("he-IL");

  const htmlContent = `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body {
    font-family: "Helvetica", "Arial", sans-serif;
    direction: rtl;
    color: #1a1a1a;
    font-size: 11px;
    margin: 0;
    padding: 0;
  }
  .topbar {
    display: flex;
    justify-content: space-between;
    align-items: stretch;
    border: 1px solid #6b7280;
    border-radius: 2px;
    margin-bottom: 6px;
  }
  .topbar > div {
    padding: 8px 12px;
    border-left: 1px solid #6b7280;
  }
  .topbar > div:last-child { border-left: none; }
  .top-employer { flex: 1; text-align: right; }
  .top-employer .name { font-size: 14px; font-weight: 700; }
  .top-employer .addr { font-size: 10px; color: #555; margin-top: 2px; }
  .top-title { flex: 1.2; text-align: center; }
  .top-title .label { font-size: 11px; color: #555; }
  .top-title .month { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; margin-top: 2px; }
  .top-employee { flex: 1; text-align: right; }
  .top-employee .name { font-size: 14px; font-weight: 700; }
  .top-employee .num { font-size: 10px; color: #555; margin-top: 2px; }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    border: 1px solid #6b7280;
    border-radius: 2px;
    margin-bottom: 10px;
  }
  .info-cell {
    padding: 6px 10px;
    border-left: 1px solid #d1d5db;
    border-bottom: 1px solid #d1d5db;
  }
  .info-cell:nth-child(4n) { border-left: none; }
  .info-cell:nth-last-child(-n+4) { border-bottom: none; }
  .info-cell .k { font-size: 9px; color: #6b7280; }
  .info-cell .v { font-size: 11px; font-weight: 600; margin-top: 1px; }

  table { width: 100%; border-collapse: collapse; }
  .tbl {
    border: 1px solid #6b7280;
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 8px;
  }
  .tbl > caption {
    background: #1f2937;
    color: #fff;
    font-weight: 700;
    padding: 6px 12px;
    text-align: right;
    font-size: 12px;
    letter-spacing: 0.5px;
    caption-side: top;
  }
  .tbl th {
    background: #f3f4f6;
    color: #374151;
    font-weight: 700;
    padding: 6px 8px;
    border-bottom: 1px solid #6b7280;
    font-size: 10px;
  }
  .tbl td {
    padding: 5px 8px;
    border-bottom: 1px solid #e5e7eb;
    font-size: 11px;
  }
  .tbl tr:last-child td { border-bottom: none; }
  .tbl .desc { text-align: right; }
  .tbl .num { text-align: left; font-variant-numeric: tabular-nums; }
  .tbl .extra td { background: #fafafa; font-weight: 600; }

  .split { display: flex; gap: 8px; margin-bottom: 8px; }
  .split > div { flex: 1; }

  .summary {
    border: 1.5px solid #1f2937;
    border-radius: 2px;
    padding: 12px 16px;
    background: #f9fafb;
  }
  .summary-row {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    font-size: 12px;
  }
  .summary-row.tot {
    border-top: 1px solid #6b7280;
    margin-top: 6px;
    padding-top: 8px;
  }
  .summary-row.net {
    border-top: 2.5px solid #1f2937;
    margin-top: 6px;
    padding-top: 10px;
    font-size: 18px;
    font-weight: 800;
  }
  .summary-row .v { font-variant-numeric: tabular-nums; }

  .footer {
    margin-top: 14px;
    padding-top: 8px;
    border-top: 1px dashed #9ca3af;
    display: flex;
    justify-content: space-between;
    font-size: 9px;
    color: #6b7280;
  }
</style>
</head>
<body>
  <div class="topbar">
    <div class="top-employer">
      <div class="name">${employerName}</div>
      ${employerAddress ? `<div class="addr">${employerAddress}</div>` : ""}
      ${employerTaxFile ? `<div class="addr">תיק ניכויים: ${employerTaxFile}</div>` : ""}
    </div>
    <div class="top-title">
      <div class="label">תלוש משכורת לחודש</div>
      <div class="month">${monthLabel}</div>
    </div>
    <div class="top-employee">
      <div class="name">${employeeName}</div>
      <div class="num">מס' עובד: ${employeeNumber}</div>
      <div class="num">ת.ז.: ${nationalId}</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-cell"><div class="k">מחלקה</div><div class="v">${department}</div></div>
    <div class="info-cell"><div class="k">דרגה</div><div class="v">${grade}</div></div>
    <div class="info-cell"><div class="k">ותק</div><div class="v">${vetek}</div></div>
    <div class="info-cell"><div class="k">כתובת</div><div class="v">${address}</div></div>
    <div class="info-cell"><div class="k">סה"כ שעות</div><div class="v">${Number(totals.totalHours || 0).toFixed(2)}</div></div>
    <div class="info-cell"><div class="k">סה"כ משמרות</div><div class="v">${totals.totalShifts || 0}</div></div>
    <div class="info-cell"><div class="k">תעריף בסיס</div><div class="v">₪${fmt(baseRate)}</div></div>
    <div class="info-cell"><div class="k">תעריף נסיעה</div><div class="v">₪${fmt(baseRideRate)}</div></div>
  </div>

  <table class="tbl">
    <caption>פירוט תשלומים</caption>
    <thead>
      <tr>
        <th style="width:22%">סכום</th>
        <th style="width:18%">תעריף</th>
        <th style="width:14%">כמות</th>
        <th>תאור התשלום</th>
      </tr>
    </thead>
    <tbody>
      ${earningsRows}
      ${travelRow}
      ${vacationRow}
      ${trainingRow}
      ${sickRows}
    </tbody>
  </table>

  <div class="split">
    <table class="tbl">
      <caption>ניכויי חובה</caption>
      <thead>
        <tr><th style="width:35%">סכום</th><th>תאור הניכוי</th></tr>
      </thead>
      <tbody>
        ${dedRow("מס הכנסה", incomeTax)}
        ${dedRow("ביטוח לאומי", blAmount)}
        ${dedRow("דמי בריאות", healthAmount)}
        ${pensiaRows}
      </tbody>
    </table>

    <table class="tbl">
      <caption>זיכויים</caption>
      <thead>
        <tr><th style="width:35%">סכום</th><th>תאור הזיכוי</th></tr>
      </thead>
      <tbody>
        ${creditRows}
      </tbody>
    </table>
  </div>

  <div class="summary">
    <div class="summary-row"><span>סה"כ ברוטו</span><span class="v">₪${fmt(bruto)}</span></div>
    <div class="summary-row"><span>חייב מ.ה.</span><span class="v">₪${fmt(bruto)}</span></div>
    <div class="summary-row"><span>חייב ב.ל.</span><span class="v">₪${fmt(bruto)}</span></div>
    <div class="summary-row tot"><span>סה"כ ניכויים</span><span class="v">₪${fmt(totalDeductions)}</span></div>
    <div class="summary-row net"><span>נטו לתשלום</span><span class="v">₪${fmt(neto)}</span></div>
  </div>

  <div class="footer">
    <span>בוצע ע"י GuardPay · ${generatedAt}</span>
    <span>תלוש זה הופק לצרכי מעקב אישי בלבד ואינו תלוש מקור</span>
  </div>
</body>
</html>`;

  try {
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    await Sharing.shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" });
  } catch (error) {
    console.error("Failed to generate PDF", error);
  }
};
