import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { buildPaycheckModel } from "./paycheckData";
import { lightTokens } from "./theme";
import { formatDate } from "./utils";

const fmt = (n) =>
  Number(n || 0).toLocaleString("he-IL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// Build the redesigned A4 paycheck. Direction follows the user's language:
// Hebrew renders RTL (item column on the right, numbers on the left, soft
// gold glow on the net-pay card). English renders LTR. Same rows source
// from buildPaycheckModel so the on-screen modal and the print match.
//
// Signature is backwards-compatible — older callers that don't pass `lang`
// keep the Hebrew layout that was hardcoded before.
export const handleGeneratePDF = async (
  totals,
  profile,
  selectedMonth,
  shifts,
  monthlyReport,
  lang = "he",
) => {
  const isHe = lang !== "en";
  const dir = isHe ? "rtl" : "ltr";
  const htmlLang = isHe ? "he" : "en";

  const model = buildPaycheckModel({
    profile,
    shifts,
    totals,
    monthlyReport,
    lang: isHe ? "he" : "en",
  });

  const t = lightTokens;
  const monthLabel = esc(formatDate(selectedMonth));
  const employeeName = esc(profile?.user_name || "");
  const nationalId = esc(profile?.national_id || "—");
  const employeeNumber = esc(profile?.employee_number || "—");
  const baseRate = Number(profile?.price_per_hour || 0);
  const generatedAt = new Date().toLocaleDateString(isHe ? "he-IL" : "en-US");

  // Localised section labels — the on-screen modal already pulls these
  // from i18n, but the PDF runs outside React so we inline them.
  const L = isHe
    ? {
        brand: "GUARDPAY",
        statement: "פירוט שכר",
        earnings: "תשלומים",
        deductions: "ניכויים",
        credits: "זיכויים",
        grossTotal: "סה״כ ברוטו",
        totalDed: "סה״כ ניכויים",
        netPay: "שכר נטו",
        of: "מתוך",
        gross: "ברוטו",
        baseRateLabel: "תעריף בסיס",
        item: "פריט",
        rate: "תעריף",
        qty: "כמות",
        amount: "סכום",
        idLabel: 'ת"ז',
        employeeLabel: "מס׳ עובד",
        footerNote: "תלוש זה הופק לצרכי מעקב אישי בלבד",
      }
    : {
        brand: "GUARDPAY",
        statement: "Pay Statement",
        earnings: "Earnings",
        deductions: "Deductions",
        credits: "Credits",
        grossTotal: "Gross total",
        totalDed: "Total deductions",
        netPay: "Net pay",
        of: "of",
        gross: "gross",
        baseRateLabel: "Base rate",
        item: "Item",
        rate: "Rate",
        qty: "Qty",
        amount: "Amount",
        idLabel: "ID",
        employeeLabel: "Employee #",
        footerNote: "For personal record-keeping only.",
      };

  const earningsRows = model.earnings
    .map((r) => {
      const qty = r.kind === "hours" ? r.hours.toFixed(2) : String(r.qty);
      return `
      <tr>
        <td class="desc">${esc(r.label)}</td>
        <td class="num">${fmt(r.rate)}</td>
        <td class="num">${qty}</td>
        <td class="num amt">${fmt(r.amount)}</td>
      </tr>`;
    })
    .join("");

  const dedRow = (label, amount) => `
    <tr>
      <td class="desc">${esc(label)}</td>
      <td class="num neg">-${fmt(amount)}</td>
    </tr>`;

  const deductionsRows = model.deductions
    .map((d) => dedRow(d.label, d.amount))
    .join("");

  const creditsRows = model.credits
    .map(
      (c) => `
    <tr>
      <td class="desc">${esc(c.label)}</td>
      <td class="num pos">${fmt(c.amount)}</td>
    </tr>`,
    )
    .join("");

  const employeeLine = employeeName
    ? `<div class="who">${employeeName} · <span class="muted">${L.idLabel}</span> ${nationalId} · <span class="muted">${L.employeeLabel}</span> ${employeeNumber}</div>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="${htmlLang}" dir="${dir}">
<head>
  <meta charset="UTF-8" />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,500&family=Frank+Ruhl+Libre:wght@400;500;700&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    @page { size: A4; margin: 16mm 18mm; }
    * { box-sizing: border-box; -webkit-font-smoothing: antialiased; }
    body {
      margin: 0;
      padding: 0;
      color: ${t.ink};
      background: ${t.bg};
      font-family: ${isHe ? '"Frank Ruhl Libre"' : '"Manrope"'}, "Helvetica Neue", sans-serif;
      font-size: 11.5px;
      line-height: 1.5;
      direction: ${dir};
    }
    .serif { font-family: "Cormorant Garamond", "Frank Ruhl Libre", serif; }
    .he { font-family: "Frank Ruhl Libre", "Cormorant Garamond", serif; }
    .eyebrow {
      font-size: 9.5px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: ${t.muted};
      font-weight: 600;
    }
    .eyebrow.accent { color: ${t.accent}; }
    .center { text-align: center; }
    .num { font-variant-numeric: tabular-nums; }
    .neg { color: ${t.neg}; }
    .pos { color: ${t.pos}; }
    .muted { color: ${t.muted}; }

    .letterhead {
      text-align: center;
      padding: 8px 0 18px;
      border-bottom: 1px solid ${t.border};
      direction: ${dir};
    }
    .letterhead .brand {
      letter-spacing: 4px;
      font-size: 11px;
      color: ${t.accent};
      font-weight: 600;
    }
    .letterhead h1 {
      font-family: "Cormorant Garamond", "Frank Ruhl Libre", serif;
      font-size: 30px;
      font-weight: 500;
      letter-spacing: -0.5px;
      margin: 6px 0 0;
    }
    .letterhead .month {
      font-family: "Cormorant Garamond", "Frank Ruhl Libre", serif;
      font-style: italic;
      font-size: 16px;
      color: ${t.inkSoft};
      margin-top: 2px;
    }
    .letterhead .who {
      margin-top: 12px;
      font-size: 11px;
      color: ${t.muted};
    }

    .section-rule {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 22px 0 8px;
      flex-direction: ${isHe ? "row-reverse" : "row"};
    }
    .section-rule .line {
      width: 24px;
      height: 1px;
      background: ${t.ink};
    }
    .section-rule.accent .line { background: ${t.accent}; }

    table.t {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      direction: ${dir};
    }
    table.t th {
      text-align: ${isHe ? "right" : "left"};
      font-size: 9px;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: ${t.muted};
      font-weight: 600;
      padding: 6px 0;
      border-bottom: 1px solid ${t.border};
    }
    /* Numeric column headers always align toward the value column edge. */
    table.t th.numhead { text-align: ${isHe ? "left" : "right"}; }
    table.t td {
      padding: 10px 0;
      border-bottom: 1px solid ${t.borderSoft};
      font-size: 12px;
      vertical-align: baseline;
    }
    table.t td.desc {
      font-family: ${isHe ? '"Frank Ruhl Libre"' : '"Manrope"'}, "Cormorant Garamond", serif;
      font-weight: 500;
      color: ${t.ink};
      text-align: ${isHe ? "right" : "left"};
    }
    table.t td.num {
      text-align: ${isHe ? "left" : "right"};
      font-family: "Manrope", sans-serif;
      color: ${t.inkSoft};
      font-weight: 500;
    }
    table.t td.amt {
      font-family: "Cormorant Garamond", serif;
      font-weight: 500;
      font-size: 14px;
      color: ${t.ink};
    }

    .total {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      border-top: 1.5px solid ${t.ink};
      margin-top: 8px;
      padding-top: 10px;
      flex-direction: ${isHe ? "row-reverse" : "row"};
    }
    .total.accent { border-top-color: ${t.accent}; }
    .total .lbl {
      font-family: "Cormorant Garamond", "Frank Ruhl Libre", serif;
      font-style: italic;
      font-size: 14px;
    }
    .total .val {
      font-family: "Cormorant Garamond", serif;
      font-size: 16px;
      font-weight: 500;
      letter-spacing: -0.3px;
    }

    .netcard {
      margin-top: 28px;
      background: ${t.anchor};
      color: ${t.anchorInk};
      border-radius: 14px;
      padding: 22px 24px;
      position: relative;
      overflow: hidden;
      direction: ${dir};
    }
    /*
     * Soft gold glow — radial-ish via stacked linear gradients. Position
     * follows the writing direction so the warm light comes from the
     * leading-end corner of the card.
     */
    .netcard::before {
      content: "";
      position: absolute;
      top: 0;
      ${isHe ? "left: 0;" : "right: 0;"}
      width: 280px;
      height: 220px;
      background: linear-gradient(
        ${isHe ? "135deg" : "225deg"},
        rgba(184,153,104,0.32) 0%,
        rgba(184,153,104,0) 70%
      );
      pointer-events: none;
    }
    .netcard::after {
      content: "";
      position: absolute;
      top: 0;
      ${isHe ? "left: 0;" : "right: 0;"}
      width: 180px;
      height: 140px;
      background: linear-gradient(
        ${isHe ? "135deg" : "225deg"},
        rgba(184,153,104,0.20) 0%,
        rgba(184,153,104,0) 65%
      );
      pointer-events: none;
    }
    .netcard .lbl {
      font-size: 10px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: ${t.anchorMuted};
      font-weight: 600;
    }
    .netcard .amount {
      display: flex;
      align-items: baseline;
      gap: 6px;
      margin-top: 6px;
      flex-direction: ${isHe ? "row-reverse" : "row"};
      justify-content: ${isHe ? "flex-end" : "flex-start"};
    }
    .netcard .amount .n {
      font-family: "Cormorant Garamond", serif;
      font-size: 38px;
      font-weight: 500;
      letter-spacing: -1px;
      line-height: 1;
    }
    .netcard .amount .u {
      font-family: "Cormorant Garamond", serif;
      font-size: 18px;
      color: ${t.anchorMuted};
    }
    .netcard .helper {
      margin-top: 8px;
      font-family: ${isHe ? '"Frank Ruhl Libre"' : '"Cormorant Garamond"'}, serif;
      font-style: ${isHe ? "normal" : "italic"};
      font-size: 12px;
      color: ${t.anchorMuted};
      text-align: ${isHe ? "right" : "left"};
    }

    .footer {
      margin-top: 18px;
      padding-top: 10px;
      border-top: 1px dashed ${t.border};
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: ${t.muted};
      flex-direction: ${isHe ? "row-reverse" : "row"};
    }
  </style>
</head>
<body>
  <div class="letterhead">
    <div class="brand">${L.brand}</div>
    <h1>${L.statement}</h1>
    <div class="month">${monthLabel}</div>
    ${employeeLine}
  </div>

  <div class="section-rule">
    <span class="line"></span>
    <span class="eyebrow">${L.earnings}</span>
  </div>
  <table class="t">
    <thead>
      <tr>
        <th>${L.item}</th>
        <th class="numhead">${L.rate}</th>
        <th class="numhead">${L.qty}</th>
        <th class="numhead">${L.amount}</th>
      </tr>
    </thead>
    <tbody>
      ${earningsRows}
    </tbody>
  </table>
  <div class="total">
    <span class="lbl">${L.grossTotal}</span>
    <span class="val">${fmt(model.bruto)} ₪</span>
  </div>

  <div class="section-rule accent">
    <span class="line"></span>
    <span class="eyebrow accent">${L.deductions}</span>
  </div>
  <table class="t">
    <tbody>
      ${deductionsRows}
    </tbody>
  </table>
  <div class="total accent">
    <span class="lbl">${L.totalDed}</span>
    <span class="val neg">-${fmt(model.totalDeductions)} ₪</span>
  </div>

  ${
    creditsRows
      ? `<div class="section-rule">
    <span class="line"></span>
    <span class="eyebrow">${L.credits}</span>
  </div>
  <table class="t">
    <tbody>${creditsRows}</tbody>
  </table>`
      : ""
  }

  <div class="netcard">
    <div class="lbl">${L.netPay}</div>
    <div class="amount">
      <span class="n">${fmt(model.neto)}</span>
      <span class="u">₪</span>
    </div>
    <div class="helper">${L.netPay} · ${L.of} ${fmt(model.bruto)} ₪ ${L.gross} · ${L.baseRateLabel} ${fmt(baseRate)} ₪/h</div>
  </div>

  <div class="footer">
    <span>GuardPay · ${generatedAt}</span>
    <span>${L.footerNote}</span>
  </div>
</body>
</html>`;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, {
      UTI: ".pdf",
      mimeType: "application/pdf",
    });
  } catch (err) {
    console.error("Failed to generate PDF", err);
  }
};
