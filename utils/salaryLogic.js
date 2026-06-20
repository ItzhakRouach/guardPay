// Single source of truth for GuardPay salary math.
//
// This file is a byte-faithful copy of the deployed Appwrite cloud
// function (`697d0f3c001bba7f03d2`, actions CALCULATE_SALARY /
// CALCULATE_SHIFT) so the app can compute everything locally and the
// flaky cloud round-trip can be dropped from the hot path. The numbers
// here MUST equal what the cloud produced — any change shifts every
// user's neto. Covered by __tests__/salary.test.js.
//
// Kept as CommonJS so the Jest suite can require() it without a babel
// config (matches utils/decimal.js / utils/shiftType.js). App code
// imports the thin ESM re-export at lib/salaryLogic.js.

// --- Monthly salary (mirrors CALCULATE_SALARY) — Israeli 2026 values ---
const calculateSalary = (
  regularPay = 0,
  extraPay = 0,
  travelPay = 0,
  trainingPay = 0,
  vacationPay = 0,
  creditPoints = 2.25, // ברירת מחדל לגבר בישראל
  settlementPercent = 0, // מגיע מה-Profile (settlement_percent)
  settlementAnnualCap = 0, // מגיע מה-Profile (settlement_annual_cap)
  sickPay = 0, // דמי מחלה — חושב בצד הלקוח לפי חוק דמי מחלה
) => {
  const bruto =
    Number(regularPay) +
    Number(extraPay) +
    Number(travelPay) +
    Number(trainingPay) +
    Number(sickPay) +
    Number(vacationPay);

  // 1. פנסיה — 7% שכר רגיל/נוסף/מחלה, 5% נסיעות
  const pensia =
    Number(regularPay) * 0.07 +
    Number(extraPay) * 0.07 +
    Number(travelPay) * 0.05 +
    Number(sickPay) * 0.07;

  // 2. ביטוח לאומי ובריאות (מדרגה ב-7522)
  const thresholdBL = 7522;
  const bituahLeumiAndHealth =
    bruto <= thresholdBL
      ? bruto * 0.035
      : thresholdBL * 0.035 + (bruto - thresholdBL) * 0.12;

  // 3. מדרגות מס הכנסה 2026 (5 מדרגות)
  let grossTax = 0;
  if (bruto <= 7010) grossTax = bruto * 0.1;
  else if (bruto <= 10060) grossTax = 701 + (bruto - 7010) * 0.14;
  else if (bruto <= 16150) grossTax = 701 + 427 + (bruto - 10060) * 0.2;
  else if (bruto <= 22440)
    grossTax = 701 + 427 + 1218 + (bruto - 16150) * 0.31;
  else grossTax = 701 + 427 + 1218 + 1950 + (bruto - 22440) * 0.35;

  // 4. זיכויים — נקודות זיכוי + הטבת יישוב
  const creditValue = creditPoints * 242; // שווי נקודה 2026

  let settlementBenefitValue = 0;
  if (settlementPercent > 0 && settlementAnnualCap > 0) {
    const monthlyCap = settlementAnnualCap / 12;
    settlementBenefitValue =
      Math.min(bruto, monthlyCap) * (settlementPercent / 100);
  }

  const finalIncomeTax = Math.max(
    0,
    grossTax - creditValue - settlementBenefitValue,
  );
  const totalDeductions = pensia + bituahLeumiAndHealth + finalIncomeTax;

  return {
    bruto: Number(bruto.toFixed(2)),
    pensia: Number(pensia.toFixed(2)),
    bituahLeumiAndHealth: Number(bituahLeumiAndHealth.toFixed(2)),
    incomeTax: Number(finalIncomeTax.toFixed(2)),
    settlementBenefitValue: Number(settlementBenefitValue.toFixed(2)),
    neto: Number((bruto - totalDeductions).toFixed(2)),
    totalDeductions: Number(totalDeductions.toFixed(2)),
  };
};

// --- Single-shift pay (mirrors CALCULATE_SHIFT's calculateShiftPay) ---
const calculateShiftPay = (
  startTime,
  endTime,
  baseRate,
  travelRate,
  isHoliday,
) => {
  const start = new Date(startTime);
  let end = new Date(endTime);
  if (end < start) end.setDate(end.getDate() + 1);
  const base = Number(baseRate);

  // Night shift = ≥2h in the 22:00–06:00 window → regular cap drops 8→7.
  const checkNightShift = () => {
    let nightHours = 0;
    let current = new Date(start);
    while (current < end) {
      if (current.getHours() >= 22 || current.getHours() < 6)
        nightHours += 0.25;
      current.setMinutes(current.getMinutes() + 15);
    }
    return nightHours >= 2;
  };
  const regLimit = checkNightShift() ? 7 : 8;

  const calculateHours = (segStart, segEnd, forceWeekday = false) => {
    let rPay = 0,
      ePay = 0,
      rHours = 0,
      eHours = 0;
    let h100 = 0,
      h125e = 0,
      h150e = 0,
      h150s = 0,
      h175s = 0,
      h200s = 0;

    const duration = (segEnd - segStart) / 3600000;
    const globalOffset = (segStart - start) / 3600000;

    for (let i = 0; i < duration; i += 0.25) {
      const currentH = globalOffset + i;
      const blockTime = new Date(segStart.getTime() + i * 3600000);

      const isWeekendOrHoliday =
        !forceWeekday &&
        (isHoliday ||
          (blockTime.getDay() === 5 && blockTime.getHours() >= 16) ||
          blockTime.getDay() === 6 ||
          (blockTime.getDay() === 0 && blockTime.getHours() < 4));

      if (currentH < regLimit) {
        if (isWeekendOrHoliday) {
          h150s += 0.25;
          rPay += 0.25 * base * 1.5;
        } else {
          h100 += 0.25;
          rPay += 0.25 * base;
        }
        rHours += 0.25;
      } else if (currentH < regLimit + 2) {
        if (isWeekendOrHoliday) {
          h175s += 0.25;
          ePay += 0.25 * base * 1.75;
        } else {
          h125e += 0.25;
          ePay += 0.25 * base * 1.25;
        }
        eHours += 0.25;
      } else {
        if (isWeekendOrHoliday) {
          h200s += 0.25;
          ePay += 0.25 * base * 2;
        } else {
          h150e += 0.25;
          ePay += 0.25 * base * 1.5;
        }
        eHours += 0.25;
      }
    }
    return {
      rPay,
      ePay,
      rHours,
      eHours,
      h100,
      h125e,
      h150e,
      h150s,
      h175s,
      h200s,
    };
  };

  const sundayCutoff = new Date(start);
  sundayCutoff.setDate(sundayCutoff.getDate() - sundayCutoff.getDay() + 7);
  sundayCutoff.setHours(4, 0, 0, 0);

  let res;
  if (start < sundayCutoff && end > sundayCutoff) {
    const p1 = calculateHours(start, sundayCutoff);
    const p2 = calculateHours(sundayCutoff, end, true);
    res = {
      p: p1.rPay + p1.ePay + p2.rPay + p2.ePay,
      rh: p1.rHours + p2.rHours,
      eh: p1.eHours + p2.eHours,
      rp: p1.rPay + p2.rPay,
      ep: p1.ePay + p2.ePay,
      h100: p1.h100 + p2.h100,
      h125e: p1.h125e + p2.h125e,
      h150e: p1.h150e + p2.h150e,
      h150s: p1.h150s + p2.h150s,
      h175s: p1.h175s + p2.h175s,
      h200s: p1.h200s + p2.h200s,
    };
  } else {
    const r = calculateHours(start, end);
    res = {
      p: r.rPay + r.ePay,
      rh: r.rHours,
      eh: r.eHours,
      rp: r.rPay,
      ep: r.ePay,
      h100: r.h100,
      h125e: r.h125e,
      h150e: r.h150e,
      h150s: r.h150s,
      h175s: r.h175s,
      h200s: r.h200s,
    };
  }

  const travel = Number(travelRate || 0);

  return {
    total_amount: Number((res.p + travel).toFixed(2)),
    reg_hours: Number(res.rh.toFixed(2)),
    extra_hours: Number(res.eh.toFixed(2)),
    reg_pay_amount: Number(res.rp.toFixed(2)),
    extra_pay_amount: Number(res.ep.toFixed(2)),
    travel_pay_amount: Number(travel.toFixed(2)),
    h100_hours: Number(res.h100.toFixed(2)),
    h125_extra_hours: Number(res.h125e.toFixed(2)),
    h150_extra_hours: Number(res.h150e.toFixed(2)),
    h175_extra_hours: isHoliday ? 0 : Number(res.h175s.toFixed(2)),
    h200_extra_hours: isHoliday ? 0 : Number(res.h200s.toFixed(2)),
    h150_shabat: isHoliday ? 0 : Number(res.h150s.toFixed(2)),
    h150_holiday: isHoliday ? Number(res.h150s.toFixed(2)) : 0,
    h175_holiday: isHoliday ? Number(res.h175s.toFixed(2)) : 0,
    h200_holiday: isHoliday ? Number(res.h200s.toFixed(2)) : 0,
  };
};

// --- Shift document builder (mirrors the CALCULATE_SHIFT action wrapper) ---
// Produces the exact shifts_history document the cloud function returned,
// so the client can write it directly with no behavioural change.
// Training & vacation are flat baseRate×8 (travel only for training).
const computeShiftDoc = ({
  startTime,
  endTime,
  baseRate,
  travelRate = 0,
  type,
  isHoliday = false,
}) => {
  if (type === "training" || type === "vacation") {
    return {
      total_amount: Number(baseRate * 8),
      reg_hours: 0,
      extra_hours: 0,
      reg_pay_amount: 0,
      extra_pay_amount: 0,
      travel_pay_amount: type === "training" ? Number(travelRate) : 0,
      h100_hours: 0,
      h125_extra_hours: 0,
      h150_extra_hours: 0,
      h175_extra_hours: 0,
      h200_extra_hours: 0,
      h150_shabat: 0,
      h150_holiday: 0,
      h175_holiday: 0,
      h200_holiday: 0,
      base_rate: baseRate,
      is_training: type === "training",
      is_vacation: type === "vacation",
      start_time: startTime,
      end_time: endTime,
    };
  }

  const result = calculateShiftPay(
    startTime,
    endTime,
    baseRate,
    travelRate,
    isHoliday,
  );
  result.is_training = false;
  result.is_vacation = false;
  result.start_time = startTime;
  result.end_time = endTime;
  result.base_rate = Number(baseRate);
  result.is_holiday = !!isHoliday;
  return result;
};

module.exports = { calculateSalary, calculateShiftPay, computeShiftDoc };
