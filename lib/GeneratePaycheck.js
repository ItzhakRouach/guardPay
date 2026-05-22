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

// Print as a clean A4 sheet — LTR even when the app is in Hebrew, matching
// the redesigned paycheck modal. The on-screen modal in app/paycheck.jsx
// uses the same buildPaycheckModel rows so what the user sees IS what
// prints — same labels, same numbers.
//
// Signature unchanged so existing call sites (Overview CTA, Paycheck modal
// Export button) keep working.
export const handleGeneratePDF = async (
  totals,
  profile,
  selectedMonth,
  shifts,
  monthlyReport,
) => {
  const model = buildPaycheckModel({
    profile,
    shifts,
    totals,
    monthlyReport,
    lang: "he",
  });

  const t = lightTokens;
  const monthLabel = esc(formatDate(selectedMonth));
  const employeeName = esc(profile?.user_name || "");
  const nationalId = esc(profile?.national_id || "—");
  const employeeNumber = esc(profile?.employee_number || "—");
  const baseRate = Number(profile?.price_per_hour || 0);
  const generatedAt = new Date().toLocaleDateString("he-IL");

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

  const html = `<!DOCTYPE html>
<html lang="he" dir="ltr">
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
      font-family: "Manrope", "Helvetica Neue", sans-serif;
      font-size: 11.5px;
      line-height: 1.5;
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
    }
    .letterhead .brand {
      letter-spacing: 4px;
      font-size: 11px;
      color: ${t.accent};
      font-weight: 600;
    }
    .letterhead h1 {
      font-family: "Cormorant Garamond", serif;
      font-size: 30px;
      font-weight: 500;
      letter-spacing: -0.5px;
      margin: 6px 0 0;
    }
    .letterhead .month {
      font-family: "Cormorant Garamond", serif;
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
    }
    table.t th {
      text-align: left;
      font-size: 9px;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: ${t.muted};
      font-weight: 600;
      padding: 6px 0;
      border-bottom: 1px solid ${t.border};
    }
    table.t th.right { text-align: right; }
    table.t td {
      padding: 10px 0;
      border-bottom: 1px solid ${t.borderSoft};
      font-size: 12px;
      vertical-align: baseline;
    }
    table.t td.desc {
      font-family: "Frank Ruhl Libre", "Cormorant Garamond", serif;
      font-weight: 500;
      color: ${t.ink};
    }
    table.t td.num {
      text-align: right;
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
    }
    .total.accent { border-top-color: ${t.accent}; }
    .total .lbl {
      font-family: "Cormorant Garamond", serif;
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
    }
    .netcard::after {
      content: "";
      position: absolute;
      top: 0; right: 0; bottom: 0;
      width: 4px;
      background: ${t.accent};
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
      font-family: "Cormorant Garamond", serif;
      font-style: italic;
      font-size: 12px;
      color: ${t.anchorMuted};
    }

    .footer {
      margin-top: 18px;
      padding-top: 10px;
      border-top: 1px dashed ${t.border};
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: ${t.muted};
    }
    .footer .he { font-family: "Frank Ruhl Libre", serif; }
  </style>
</head>
<body>
  <div class="letterhead">
    <div class="brand">GUARDPAY</div>
    <h1>Pay Statement</h1>
    <div class="month">${monthLabel}</div>
    ${
      employeeName
        ? `<div class="who"><span class="he">${employeeName}</span> · <span class="he">ת.ז.</span> ${nationalId} · <span class="he">מס' עובד</span> ${employeeNumber}</div>`
        : ""
    }
  </div>

  <div class="section-rule">
    <span class="line"></span>
    <span class="eyebrow">Earnings</span>
  </div>
  <table class="t">
    <thead>
      <tr>
        <th>Item</th>
        <th class="right">Rate</th>
        <th class="right">Qty</th>
        <th class="right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${earningsRows}
    </tbody>
  </table>
  <div class="total">
    <span class="lbl">Gross total</span>
    <span class="val">${fmt(model.bruto)} ₪</span>
  </div>

  <div class="section-rule accent">
    <span class="line"></span>
    <span class="eyebrow accent">Deductions</span>
  </div>
  <table class="t">
    <tbody>
      ${deductionsRows}
    </tbody>
  </table>
  <div class="total accent">
    <span class="lbl">Total deductions</span>
    <span class="val neg">-${fmt(model.totalDeductions)} ₪</span>
  </div>

  ${
    creditsRows
      ? `<div class="section-rule">
    <span class="line"></span>
    <span class="eyebrow">Credits</span>
  </div>
  <table class="t">
    <tbody>${creditsRows}</tbody>
  </table>`
      : ""
  }

  <div class="netcard">
    <div class="lbl">Net pay</div>
    <div class="amount">
      <span class="n">${fmt(model.neto)}</span>
      <span class="u">₪</span>
    </div>
    <div class="helper">Net pay · of ${fmt(model.bruto)} ₪ gross · base rate ${fmt(baseRate)} ₪/h</div>
  </div>

  <div class="footer">
    <span>GuardPay · ${generatedAt}</span>
    <span class="he">תלוש זה הופק לצרכי מעקב אישי בלבד</span>
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
