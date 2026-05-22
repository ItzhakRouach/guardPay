// Shared data model for the Paycheck view (on-screen modal + PDF export).
// All earnings + deductions aggregation lives here so the modal and the
// PDF render from byte-identical rows. The cloud-function-derived totals
// in monthlyReport are the source of truth for neto, taxes, BL & pension.

const BL_RATIO = 0.482;
const HEALTH_RATIO = 1 - BL_RATIO;
const PENSIA_REG_RATE = 0.07;
const PENSIA_EXTRA_RATE = 0.07;
const PENSIA_TRAVEL_RATE = 0.05;
const CREDIT_POINT_VALUE = 242;

// Same hour-bucket field-name contract used throughout the app. Keep in
// sync with lib/GeneratePaycheck.js, hooks/useMonthlySalary.js, and the
// salary-calc cloud function. Holiday flag swaps the label per row.
const HOUR_TYPES = [
  { key: "h100_hours", label: "שעות רגילות 100%", labelEn: "Regular 100%", factor: 1 },
  { key: "h125_extra_hours", label: "שעות נוספות 125%", labelEn: "Overtime 125%", factor: 1.25 },
  { key: "h150_extra_hours", label: "שעות נוספות 150%", labelEn: "Overtime 150%", factor: 1.5 },
  {
    key: "h150_shabat",
    label: "שעות שבת 150%",
    labelEn: "Shabbat 150%",
    holidayLabel: "שעות חג 150%",
    holidayLabelEn: "Holiday 150%",
    factor: 1.5,
  },
  {
    key: "h175_extra_hours",
    label: "שעות נוספות שבת 175%",
    labelEn: "Shabbat OT 175%",
    holidayLabel: "שעות נוספות חג 175%",
    holidayLabelEn: "Holiday OT 175%",
    factor: 1.75,
  },
  {
    key: "h200_extra_hours",
    label: "שעות נוספות שבת 200%",
    labelEn: "Shabbat OT 200%",
    holidayLabel: "שעות נוספות חג 200%",
    holidayLabelEn: "Holiday OT 200%",
    factor: 2,
  },
];

const pickLabel = (type, isHoliday, lang) => {
  const useEn = lang === "en";
  if (isHoliday) {
    if (useEn) return type.holidayLabelEn || type.labelEn;
    return type.holidayLabel || type.label;
  }
  return useEn ? type.labelEn : type.label;
};

const aggregateHours = (shifts, profile, lang) => {
  const groups = {};
  let brutoRegular = 0;
  let brutoExtra = 0;

  (shifts || []).forEach((s) => {
    const rate = Number(s.base_rate || profile?.price_per_hour || 0);
    const isHoliday = !!s.is_holiday;
    HOUR_TYPES.forEach((type) => {
      const hours = Number(s[type.key] || 0);
      if (hours <= 0) return;
      const finalRate = rate * type.factor;
      const amount = hours * finalRate;
      const label = pickLabel(type, isHoliday, lang);
      const k = `${label}_${finalRate.toFixed(2)}`;
      if (!groups[k]) {
        groups[k] = {
          key: k,
          label,
          rate: finalRate,
          hours: 0,
          amount: 0,
          kind: "hours",
        };
      }
      groups[k].hours += hours;
      groups[k].amount += amount;
      if (type.factor === 1) brutoRegular += amount;
      else brutoExtra += amount;
    });
  });

  return { rows: Object.values(groups), brutoRegular, brutoExtra };
};

export function buildPaycheckModel({
  profile = {},
  shifts = [],
  totals = {},
  monthlyReport = {},
  lang = "he",
}) {
  const baseRate = Number(profile.price_per_hour || 0);
  const baseRideRate = Number(profile.price_per_ride || 0);
  const dayoffRate = 8 * baseRate;

  const { rows, brutoRegular, brutoExtra } = aggregateHours(shifts, profile, lang);

  const brutoTravel = Number(totals.travelPay || 0);
  const bruto = Number(monthlyReport?.bruto || brutoRegular + brutoExtra + brutoTravel);
  const neto = Number(monthlyReport?.neto || 0);
  const totalDeductions = Number(monthlyReport?.totalDeductions || 0);

  const earnings = [...rows];
  if (brutoTravel > 0) {
    earnings.push({
      key: "travel",
      label: lang === "en" ? "Travel" : "נסיעות",
      qty: Number(totals.travelCount || 0),
      rate: baseRideRate,
      amount: brutoTravel,
      kind: "extra",
    });
  }
  if (Number(totals.vacationAmount) > 0) {
    earnings.push({
      key: "vacation",
      label: lang === "en" ? "Vacation days" : "ימי חופש",
      qty: Number(totals.vacationDays || 0),
      rate: dayoffRate,
      amount: Number(totals.vacationAmount),
      kind: "extra",
    });
  }
  if (Number(totals.trainingAmount) > 0) {
    earnings.push({
      key: "training",
      label: lang === "en" ? "Training days" : "ימי רענון",
      qty: Number(totals.trainingDays || 0),
      rate: dayoffRate,
      amount: Number(totals.trainingAmount),
      kind: "extra",
    });
  }

  // --- Deductions --------------------------------------------------------
  const blAndHealth = Number(monthlyReport?.bituahLeumiAndHealth || 0);
  const pensiaTotal = Number(monthlyReport?.pensia || 0);
  const incomeTax = Number(monthlyReport?.incomeTax || 0);
  const settlementBenefit = Number(monthlyReport?.settlementBenefitValue || 0);
  const creditPoints = Number(profile.credit_points) || 2.25;
  const creditPointsValue = creditPoints * CREDIT_POINT_VALUE;

  const blAmount = blAndHealth * BL_RATIO;
  const healthAmount = blAndHealth * HEALTH_RATIO;

  let pensiaReg = brutoRegular * PENSIA_REG_RATE;
  let pensiaExtra = brutoExtra * PENSIA_EXTRA_RATE;
  let pensiaTravel = brutoTravel * PENSIA_TRAVEL_RATE;
  const pensiaLocalSum = pensiaReg + pensiaExtra + pensiaTravel;
  if (pensiaLocalSum > 0 && pensiaTotal > 0) {
    const scale = pensiaTotal / pensiaLocalSum;
    pensiaReg *= scale;
    pensiaExtra *= scale;
    pensiaTravel *= scale;
  }

  const deductions = [
    { label: lang === "en" ? "Income tax" : "מס הכנסה", amount: incomeTax },
    {
      label: lang === "en" ? "National insurance" : "ביטוח לאומי",
      amount: blAmount,
    },
    {
      label: lang === "en" ? "Health insurance" : "ביטוח בריאות",
      amount: healthAmount,
    },
    pensiaReg > 0 && {
      label: lang === "en" ? "Pension (regular)" : "פנסיה מבטחים",
      amount: pensiaReg,
    },
    pensiaExtra > 0 && {
      label: lang === "en" ? "Pension (overtime)" : "פנסיה מבטחים ש.נ.",
      amount: pensiaExtra,
    },
    pensiaTravel > 0 && {
      label: lang === "en" ? "Pension (travel)" : "פנסיה מבטחים נסיעות",
      amount: pensiaTravel,
    },
  ].filter(Boolean);

  const credits = [
    {
      label:
        lang === "en"
          ? `Credit points (${creditPoints.toFixed(2)})`
          : `נק' זיכוי (${creditPoints.toFixed(2)})`,
      amount: -creditPointsValue,
    },
    settlementBenefit > 0 && {
      label:
        lang === "en"
          ? `Settlement benefit (${profile.settlement_percent || 0}%)`
          : `יישוב מוטב (${profile.settlement_percent || 0}%)`,
      amount: -settlementBenefit,
    },
  ].filter(Boolean);

  // Three condensed deduction lines for the on-screen modal.
  const summary = [
    {
      key: "incomeTax",
      label: lang === "en" ? "Income tax" : "מס הכנסה",
      amount: incomeTax,
    },
    {
      key: "social",
      label: lang === "en" ? "Health & social" : "ביטוח לאומי ובריאות",
      amount: blAndHealth,
    },
    {
      key: "pension",
      label: lang === "en" ? "Pension" : "פנסיה",
      amount: pensiaTotal,
    },
  ];

  return {
    earnings,
    deductions,
    credits,
    summary,
    brutoRegular,
    brutoExtra,
    brutoTravel,
    bruto,
    neto,
    totalDeductions,
    creditPoints,
    creditPointsValue,
  };
}

export { HOUR_TYPES };
