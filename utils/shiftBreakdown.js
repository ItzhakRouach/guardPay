// Turns one shifts_history document into the rows the Shift Details screen
// shows: "hours × rate = amount" per pay bracket, grouped into regular /
// overtime / travel, plus the flat-day cases (training, vacation, sick).
//
// Reads ONLY the stored buckets and amounts — it never recomputes pay, so it
// can't disagree with what the month total and the payslip show. The hour
// bracket → field mapping is the nine-bucket contract from CLAUDE.md; labels
// key off `is_holiday`, never off which field holds the hours (an imported
// חג shift keeps its hours in the Shabbat fields).
//
// CommonJS so Jest can require it; app code imports lib/shiftBreakdown.js.

const HOUR_ROWS = [
  {
    key: "h100_hours",
    percent: 100,
    labelKey: "shiftDetails.regHours",
    regular: true,
  },
  { key: "h125_extra_hours", percent: 125, labelKey: "shiftDetails.h125" },
  { key: "h150_extra_hours", percent: 150, labelKey: "shiftDetails.h150" },
  {
    key: "h150_shabat",
    percent: 150,
    labelKey: "shiftDetails.h150Shabat",
    holidayLabelKey: "shiftDetails.h150Holiday",
    regular: true,
  },
  {
    key: "h175_extra_hours",
    percent: 175,
    labelKey: "shiftDetails.h175",
    holidayLabelKey: "shiftDetails.h175Holiday",
  },
  {
    key: "h200_extra_hours",
    percent: 200,
    labelKey: "shiftDetails.h200",
    holidayLabelKey: "shiftDetails.h200Holiday",
  },
  {
    key: "h150_holiday",
    percent: 150,
    labelKey: "shiftDetails.h150Holiday",
    regular: true,
  },
  { key: "h175_holiday", percent: 175, labelKey: "shiftDetails.h175Holiday" },
  { key: "h200_holiday", percent: 200, labelKey: "shiftDetails.h200Holiday" },
];

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// Legacy writer kept an overnight shift's end on the start's calendar day
// (end < start). Treat that as "next day", exactly like calculateShiftPay.
function normalizedRange(startIso, endIso) {
  const s = new Date(startIso);
  const e = new Date(endIso);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null;
  if (e < s) e.setDate(e.getDate() + 1);
  return { s, e };
}

// Same rule as utils/salaryLogic.js checkNightShift: ≥ 2h inside 22:00–06:00.
function isNightShift(range) {
  if (!range) return false;
  let night = 0;
  const cur = new Date(range.s);
  while (cur < range.e) {
    const h = cur.getHours();
    if (h >= 22 || h < 6) night += 0.25;
    cur.setMinutes(cur.getMinutes() + 15);
  }
  return night >= 2;
}

function buildShiftBreakdown(shift) {
  if (!shift || typeof shift !== "object") return null;

  const baseRate = num(shift.base_rate);
  const travelPay = num(shift.travel_pay_amount);
  // total_amount includes travel for worked shifts but not for training
  // days (flat baseRate×8 with travel stored beside it). Present the same
  // number the month total counts.
  const total = shift.is_training
    ? num(shift.total_amount) + travelPay
    : num(shift.total_amount);
  const range = normalizedRange(shift.start_time, shift.end_time);
  const durationHours = range
    ? Math.round(((range.e - range.s) / 36e5) * 100) / 100
    : 0;

  const kind = shift.is_sick
    ? "sick"
    : shift.is_training
      ? "training"
      : shift.is_vacation
        ? "vacation"
        : "worked";

  if (kind !== "worked") {
    return {
      kind,
      baseRate,
      durationHours,
      isNight: false,
      hourRows: [],
      regularHours: 0,
      overtimeHours: 0,
      regularPay: 0,
      overtimePay: 0,
      travelPay,
      flatDayPay: num(shift.total_amount),
      sickPercent: kind === "sick" ? num(shift.sick_percent) : null,
      total,
    };
  }

  const isHoliday = !!shift.is_holiday;
  const hourRows = [];
  let regularHours = 0;
  let overtimeHours = 0;
  for (const row of HOUR_ROWS) {
    const hours = num(shift[row.key]);
    if (hours <= 0) continue;
    const rate = baseRate * (row.percent / 100);
    hourRows.push({
      key: row.key,
      labelKey:
        isHoliday && row.holidayLabelKey ? row.holidayLabelKey : row.labelKey,
      percent: row.percent,
      hours,
      rate,
      amount: hours * rate,
      regular: !!row.regular,
    });
    if (row.regular) regularHours += hours;
    else overtimeHours += hours;
  }

  return {
    kind,
    baseRate,
    durationHours,
    isNight: isNightShift(range),
    hourRows,
    regularHours,
    overtimeHours,
    regularPay: num(shift.reg_pay_amount),
    overtimePay: num(shift.extra_pay_amount),
    travelPay,
    flatDayPay: 0,
    sickPercent: null,
    total,
  };
}

module.exports = { buildShiftBreakdown, HOUR_ROWS };
