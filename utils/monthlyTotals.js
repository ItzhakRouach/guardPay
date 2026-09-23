// Pure monthly aggregation over shifts_history documents — the numbers behind
// the month header, the Overview stats grid and the payslip's "סה״כ שעות".
//
// CommonJS on purpose, same as utils/salaryLogic.js: it keeps the reducer
// require()-able from the Jest suite and out of the React hook, so the hours
// arithmetic can be tested without a renderer. App code imports the ESM
// re-export at lib/monthlyTotals.js; hooks/useMonthlySalary.js wraps this in a
// useMemo and feeds the pay figures to calculateSalary.

/** Every hour bucket a shift document can carry, paired
 *  [counted-by-the-app, holiday-variant].
 *
 *  calculateShiftPay routes a shift into ONE member of each pair and zeroes the
 *  other (utils/salaryLogic.js:229-234) — a חג shift fills the *_holiday
 *  fields, a Shabbat one the *_shabat/*_extra fields. Summing both is therefore
 *  count-once, and it counts every חג shift already stored, with no migration.
 *
 *  Imported shifts are a third case: GuardPay-Functions' importWeek folds the
 *  holiday buckets into the left-hand field before writing, so those docs look
 *  like Shabbat ones and carry is_holiday for the label. That fold is a move,
 *  never a copy — which is what keeps this sum count-once too. */
const HOUR_PAIRS = {
  h100: ["h100_hours", null],
  h150s: ["h150_shabat", "h150_holiday"],
  h125e: ["h125_extra_hours", null],
  h150e: ["h150_extra_hours", null],
  h175s: ["h175_extra_hours", "h175_holiday"],
  h200s: ["h200_extra_hours", "h200_holiday"],
};

function emptyTotals() {
  return {
    h100: 0,
    h150s: 0,
    h125e: 0,
    h150e: 0,
    h175s: 0,
    h200s: 0,
    regPay: 0,
    extraPay: 0,
    travelPay: 0,
    travelCount: 0,
    trainingAmount: 0,
    trainingDays: 0,
    vacationAmount: 0,
    vacationDays: 0,
    sickAmount: 0,
    sickDays: 0,
  };
}

/**
 * @param {Array<object>} shifts shifts_history documents for one month
 * @returns {object} the six hour buckets, the pay figures calculateSalary
 *   consumes, and the derived totalHours / totalReg / totalExtra / totalShifts.
 */
function aggregateMonthlyTotals(shifts) {
  const list = Array.isArray(shifts) ? shifts : [];

  const totals = list.reduce((acc, s) => {
    for (const [bucket, [counted, holiday]] of Object.entries(HOUR_PAIRS)) {
      acc[bucket] += Number(s[counted] || 0) + (holiday ? Number(s[holiday] || 0) : 0);
    }

    if (s.is_training) {
      acc.trainingAmount += Number(s.total_amount || 0);
      acc.trainingDays++;
    } else if (s.is_vacation) {
      acc.vacationAmount += Number(s.total_amount || 0);
      acc.vacationDays++;
    } else if (s.is_sick) {
      // Sick-day pay is precomputed client-side by buildSickDocs /
      // restreakSickDocs (utils/sickDays.js) using Israeli sick-leave law
      // (0% / 50% / 50% / 100%+), then passed to calculateSalary as sick_pay
      // so bruto and pensia are correct.
      acc.sickAmount += Number(s.total_amount || 0);
      acc.sickDays++;
    } else {
      // Only regular/extra/travel pay for worked shifts. Training/vacation go
      // in under their own keys and would otherwise double-count into bruto.
      acc.regPay += Number(s.reg_pay_amount || 0);
      acc.extraPay += Number(s.extra_pay_amount || 0);
      acc.travelPay += Number(s.travel_pay_amount || 0);
      if (Number(s.travel_pay_amount) > 0) acc.travelCount++;
    }
    return acc;
  }, emptyTotals());

  // h150 hours (שבת or חג) are priced inside the regular cap and land in
  // reg_pay_amount, so they belong to totalReg — the 175/200 tiers are extra.
  const totalHours =
    totals.h100 + totals.h125e + totals.h150e + totals.h150s + totals.h175s + totals.h200s;
  const totalReg = totals.h100 + totals.h150s;
  const totalExtra = totals.h125e + totals.h150e + totals.h175s + totals.h200s;
  const totalShifts = list.length - totals.vacationDays - totals.sickDays;

  return { ...totals, totalHours, totalReg, totalExtra, totalShifts };
}

module.exports = { aggregateMonthlyTotals, HOUR_PAIRS };
