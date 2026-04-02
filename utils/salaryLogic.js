/**
 * חישוב שכר חודשי הכולל ניכויים, נקודות זיכוי והטבת יישוב
 */
const calculateSalary = (
  regularPay = 0,
  extraPay = 0,
  travelPay = 0,
  trainingPay = 0,
  vacationPay = 0,
  creditPoints = 2.25, // ברירת מחדל לגבר בישראל
  settlementPercent = 0, // מגיע מה-Profile (למשל 12)
  settlementAnnualCap = 0, // מגיע מה-Profile (למשל 213240)
) => {
  const bruto =
    Number(regularPay) +
    Number(extraPay) +
    Number(travelPay) +
    Number(trainingPay) +
    Number(vacationPay);

  // 1. חישוב פנסיה (7% מהשכר ו-5% מהנסיעות)
  const pensia =
    (Number(regularPay) + Number(extraPay)) * 0.07 + Number(travelPay) * 0.05;

  // 2. ביטוח לאומי ובריאות (מדרגות מעודכנות)
  const thresholdBL = 7522;
  let bituahLeumiAndHealth = 0;
  if (bruto <= thresholdBL) {
    bituahLeumiAndHealth = bruto * 0.035;
  } else {
    bituahLeumiAndHealth = thresholdBL * 0.035 + (bruto - thresholdBL) * 0.12;
  }

  // 3. מס הכנסה ברוטו (לפי מדרגות מס 2026)
  let grossTax = 0;
  if (bruto <= 7010) {
    grossTax = bruto * 0.1;
  } else if (bruto <= 10060) {
    grossTax = 710 + (bruto - 7010) * 0.14;
  } else if (bruto <= 16150) {
    grossTax = 710 + 427 + (bruto - 10060) * 0.2;
  } else {
    grossTax = 710 + 427 + 1218 + (bruto - 16150) * 0.31;
  }

  // 4. חישוב זיכויים (נקודות זיכוי והטבת יישוב)
  // שווי נקודת זיכוי לחודש (מעודכן ל-2026)
  const creditPointValue = creditPoints * 242;

  // חישוב הטבת יישוב (אם קיים)
  let settlementBenefitValue = 0;
  if (settlementPercent > 0 && settlementAnnualCap > 0) {
    const monthlyCap = settlementAnnualCap / 12;
    const effectiveAmountForBenefit = Math.min(bruto, monthlyCap);
    settlementBenefitValue =
      effectiveAmountForBenefit * (settlementPercent / 100);
  }

  // מס הכנסה סופי (מס ברוטו פחות זיכויים, מינימום 0)
  const finalIncomeTax = Math.max(
    0,
    grossTax - creditPointValue - settlementBenefitValue,
  );

  const totalDeductions = pensia + bituahLeumiAndHealth + finalIncomeTax;

  return {
    bruto: Number(bruto.toFixed(2)),
    pensia: Number(pensia.toFixed(2)),
    bituahLeumiAndHealth: Number(bituahLeumiAndHealth.toFixed(2)),
    incomeTax: Number(finalIncomeTax.toFixed(2)),
    settlementBenefitValue: Number(settlementBenefitValue.toFixed(2)),
    totalDeductions: Number(totalDeductions.toFixed(2)),
    neto: Number((bruto - totalDeductions).toFixed(2)),
  };
};

const calculateShiftPay = (
  startTime,
  endTime,
  baseRate,
  travelRate = 0,
  isHoliday = false,
) => {
  const start = new Date(startTime);
  let end = new Date(endTime);

  // Handle shifts that cross midnight
  if (end < start) end.setDate(end.getDate() + 1);

  const base = Number(baseRate);

  // 1. Determine if it's a Night Shift (at least 2 hours between 22:00-06:00)
  // Night shifts reduce the "regular hours" limit from 8 to 7.
  const getNightHours = (s, e) => {
    let count = 0;
    let curr = new Date(s);
    // Increment by 30 mins for performance check
    while (curr < e && count < 2) {
      const h = curr.getHours();
      if (h >= 22 || h < 6) count += 0.5;
      curr.setMinutes(curr.getMinutes() + 30);
    }
    return count >= 2;
  };
  const regLimit = getNightHours(start, end) ? 7 : 8;

  // 2. Setup Sunday 04:00 Cutoff (End of Shabbat pay)
  const getSundayCutoff = (d) => {
    const cutoff = new Date(d);
    const day = cutoff.getDay();
    const diff = cutoff.getDate() - day + (day === 0 ? 0 : 7);
    cutoff.setDate(diff);
    cutoff.setHours(4, 0, 0, 0);
    return cutoff;
  };
  const sundayCutoff = getSundayCutoff(start);

  // 3. Core Calculation Engine (Segmented for Sunday Crossover)
  const calculateSegment = (
    segStart,
    segEnd,
    hourOffset,
    forceWeekday = false,
  ) => {
    const duration = (segEnd - segStart) / (1000 * 60 * 60);

    let res = {
      rp: 0,
      ep: 0,
      h100: 0,
      h125e: 0,
      h150e: 0,
      h150s: 0,
      h175s: 0,
      h200s: 0,
      rh: 0,
      eh: 0,
    };

    for (let i = 0; i < duration; i += 0.25) {
      const currentShiftHour = hourOffset + i;
      const blockTime = new Date(segStart.getTime() + i * 3600000);

      // Determine if this specific 15-min block is a "Special Pay" time
      // Special pay applies if: User marked as Holiday OR it's Shabbat (Fri 16:00 to Sun 04:00)
      const isBlockWeekend =
        !forceWeekday &&
        ((blockTime.getDay() === 5 && blockTime.getHours() >= 16) ||
          blockTime.getDay() === 6 ||
          (blockTime.getDay() === 0 && blockTime.getHours() < 4));

      const isSpecialPay = isHoliday || isBlockWeekend;

      if (currentShiftHour < regLimit) {
        res.rh += 0.25;
        if (isSpecialPay) {
          res.h150s += 0.25;
          res.rp += 0.25 * base * 1.5;
        } else {
          res.h100 += 0.25;
          res.rp += 0.25 * base;
        }
      } else if (currentShiftHour < regLimit + 2) {
        res.eh += 0.25;
        if (isSpecialPay) {
          res.h175s += 0.25;
          res.ep += 0.25 * base * 1.75;
        } else {
          res.h125e += 0.25;
          res.ep += 0.25 * base * 1.25;
        }
      } else {
        res.eh += 0.25;
        if (isSpecialPay) {
          res.h200s += 0.25;
          res.ep += 0.25 * base * 2.0;
        } else {
          res.h150e += 0.25;
          res.ep += 0.25 * base * 1.5;
        }
      }
    }
    return res;
  };

  // 4. Run Calculation (Split if shift crosses Sunday 04:00)
  let finalResult;
  if (start < sundayCutoff && end > sundayCutoff) {
    const p1 = calculateSegment(start, sundayCutoff, 0);
    const p2 = calculateSegment(
      sundayCutoff,
      end,
      (sundayCutoff - start) / 3600000,
      true,
    );

    finalResult = {};
    Object.keys(p1).forEach((key) => (finalResult[key] = p1[key] + p2[key]));
  } else {
    finalResult = calculateSegment(start, end, 0);
  }

  // 5. Format for JSON Response / Appwrite Database
  return {
    total_amount: Number(
      (finalResult.rp + finalResult.ep + Number(travelRate)).toFixed(2),
    ),
    reg_hours: Number(finalResult.rh.toFixed(2)),
    extra_hours: Number(finalResult.eh.toFixed(2)),
    reg_pay_amount: Number(finalResult.rp.toFixed(2)),
    extra_pay_amount: Number(finalResult.ep.toFixed(2)),
    travel_pay_amount: Number(Number(travelRate).toFixed(2)),
    h100_hours: Number(finalResult.h100.toFixed(2)),
    h125_extra_hours: Number(finalResult.h125e.toFixed(2)),
    h150_extra_hours: Number(finalResult.h150e.toFixed(2)),
    h175_extra_hours: Number(finalResult.h175s.toFixed(2)),
    h200_extra_hours: Number(finalResult.h200s.toFixed(2)),
    h150_shabat: Number(finalResult.h150s.toFixed(2)),
    is_holiday: isHoliday, // Pass the flag back for database storage
    start_time: startTime,
    end_time: end.toISOString(),
  };
};

// Helper to merge the two parts of a shift (before/after Sunday 04:00)
const mergeResults = (p1, p2) => {
  const merged = {};
  Object.keys(p1).forEach((key) => (merged[key] = p1[key] + p2[key]));
  return merged;
};

// Helper to format for your specific JSON structure and tests
const formatResponse = (res, travel) => ({
  total_amount: Number((res.rp + res.ep + Number(travel)).toFixed(2)),
  reg_hours: Number(res.rh.toFixed(2)),
  extra_hours: Number(res.eh.toFixed(2)),
  reg_pay_amount: Number(res.rp.toFixed(2)),
  extra_pay_amount: Number(res.ep.toFixed(2)),
  travel_pay_amount: Number(Number(travel).toFixed(2)),
  h100_hours: Number(res.h100.toFixed(2)),
  h125_extra_hours: Number(res.h125e.toFixed(2)),
  h150_extra_hours: Number(res.h150e.toFixed(2)),
  h175_extra_hours: Number(res.h175s.toFixed(2)),
  h200_extra_hours: Number(res.h200s.toFixed(2)),
  h150_shabat: Number(res.h150s.toFixed(2)),
});

module.exports = { calculateSalary, calculateShiftPay };
