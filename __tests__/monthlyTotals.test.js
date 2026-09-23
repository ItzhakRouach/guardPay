/* global describe, test, expect */
const { aggregateMonthlyTotals } = require("../utils/monthlyTotals");
const { computeShiftDoc } = require("../utils/salaryLogic");

// A חג shift's hours live in h150_holiday / h175_holiday / h200_holiday
// (utils/salaryLogic.js:229-234). The month total historically summed only the
// six *_shabat / *_extra_hours buckets, so every חג shift added full pay and
// ZERO hours — while its own row (ShiftRow.jsx:38-39, reg_hours + extra_hours)
// still showed the real duration.

/** Drive the reader from the writer, so a future writer change breaks THIS
 *  test rather than someone's payslip. */
const holidayDoc = (startTime, endTime) =>
  computeShiftDoc({
    startTime,
    endTime,
    baseRate: 50,
    travelRate: 0,
    type: "holiday",
    isHoliday: true,
  });

describe("aggregateMonthlyTotals — חג hours count", () => {
  test("a manual חג shift's hours count toward totalHours", () => {
    const t = aggregateMonthlyTotals([
      holidayDoc("2026-04-06T07:00:00", "2026-04-06T15:00:00"),
    ]);
    expect(t.totalHours).toBe(8);
    expect(t.totalReg).toBe(8);
    expect(t.totalExtra).toBe(0);
  });

  test("a 12h חג shift splits 8/2/2 across reg and extra", () => {
    const t = aggregateMonthlyTotals([
      holidayDoc("2026-04-06T07:00:00", "2026-04-06T19:00:00"),
    ]);
    expect(t.totalHours).toBe(12);
    expect(t.totalReg).toBe(8);
    expect(t.totalExtra).toBe(4);
  });

  test("an imported חג shift (post-fold) counts once, not twice", () => {
    // What GuardPay-Functions' importWeek writes: hours moved into the counted
    // buckets, holiday buckets zeroed, is_holiday kept for the label.
    const imported = {
      h100_hours: 0, h125_extra_hours: 0, h150_extra_hours: 0,
      h150_shabat: 8, h175_extra_hours: 0, h200_extra_hours: 0,
      h150_holiday: 0, h175_holiday: 0, h200_holiday: 0,
      reg_hours: 8, extra_hours: 0,
      reg_pay_amount: 600, extra_pay_amount: 0, travel_pay_amount: 0,
      total_amount: 600, is_holiday: true,
    };
    expect(aggregateMonthlyTotals([imported]).totalHours).toBe(8);
  });

  test("one חג shift and one Shabbat shift total 16h, each counted once", () => {
    const shabbat = computeShiftDoc({
      startTime: "2026-04-11T07:00:00", // Saturday
      endTime: "2026-04-11T15:00:00",
      baseRate: 50,
      travelRate: 0,
      type: "regular",
      isHoliday: false,
    });
    const t = aggregateMonthlyTotals([
      holidayDoc("2026-04-06T07:00:00", "2026-04-06T15:00:00"),
      shabbat,
    ]);
    expect(t.totalHours).toBe(16);
  });

  test("weekday and Shabbat shifts are numerically unchanged", () => {
    const weekday = computeShiftDoc({
      startTime: "2026-01-27T07:00:00",
      endTime: "2026-01-27T15:00:00",
      baseRate: 50, travelRate: 0, type: "regular", isHoliday: false,
    });
    const t = aggregateMonthlyTotals([weekday]);
    expect(t.totalHours).toBe(8);
    expect(t.totalReg).toBe(8);
    expect(t.totalExtra).toBe(0);
    expect(t.regPay).toBe(400);
  });

  test("training and vacation days contribute no hours", () => {
    const training = computeShiftDoc({
      startTime: "2026-01-27T07:00:00", endTime: "2026-01-27T15:00:00",
      baseRate: 50, travelRate: 0, type: "training", isHoliday: false,
    });
    const t = aggregateMonthlyTotals([training]);
    expect(t.totalHours).toBe(0);
    expect(t.trainingDays).toBe(1);
  });

  test("an empty or missing month is all zeroes, never NaN", () => {
    for (const input of [[], undefined, null]) {
      const t = aggregateMonthlyTotals(input);
      expect(t.totalHours).toBe(0);
      expect(t.totalShifts).toBe(0);
      expect(Number.isNaN(t.totalHours)).toBe(false);
    }
  });
});
