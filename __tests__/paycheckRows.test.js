/* global describe, test, expect */
const { buildPaycheckModel } = require("../lib/paycheckData");
const { computeShiftDoc } = require("../utils/salaryLogic");
const { aggregateMonthlyTotals } = require("../utils/monthlyTotals");

// HOUR_TYPES historically listed only the six *_shabat / *_extra_hours keys, so
// a חג shift — whose hours live in h150_holiday / h175_holiday / h200_holiday —
// produced NO earnings row at all in the Paycheck modal and the PDF, and was
// excluded from brutoRegular / brutoExtra.

const PROFILE = { price_per_hour: 50, price_per_ride: 0 };

const build = (shifts) =>
  buildPaycheckModel({
    profile: PROFILE,
    shifts,
    totals: aggregateMonthlyTotals(shifts),
    monthlyReport: { bruto: 1234, neto: 1000, totalDeductions: 234 },
    lang: "he",
  });

const hourRows = (model) => model.earnings.filter((r) => r.kind === "hours");

const shift = (startTime, endTime, { holiday = false } = {}) =>
  computeShiftDoc({
    startTime,
    endTime,
    baseRate: 50,
    travelRate: 0,
    type: holiday ? "holiday" : "regular",
    isHoliday: holiday,
  });

// Tuesday — an ordinary weekday, so only the חג flag can produce special hours.
const CHAG = ["2026-04-07T07:00:00", "2026-04-07T15:00:00"];
const SHABBAT = ["2026-04-11T07:00:00", "2026-04-11T15:00:00"]; // Saturday

describe("buildPaycheckModel — חג earnings rows", () => {
  test("a manual חג shift renders one 'שעות חג 150%' row", () => {
    const rows = hourRows(build([shift(...CHAG, { holiday: true })]));
    expect(rows).toHaveLength(1);
    expect(rows[0].label).toBe("שעות חג 150%");
    expect(rows[0].hours).toBe(8);
    expect(rows[0].rate).toBe(75);
    expect(rows[0].amount).toBe(600);
  });

  test("an imported חג shift (h150_shabat + is_holiday) renders the same חג row", () => {
    // Pins the deployed Appwrite function's contract: importWeek folds the
    // holiday buckets into h150_shabat and relies on is_holiday for the label.
    const imported = { ...shift(...SHABBAT), is_holiday: true };
    const rows = hourRows(build([imported]));
    expect(rows).toHaveLength(1);
    expect(rows[0].label).toBe("שעות חג 150%");
    expect(rows[0].hours).toBe(8);
  });

  test("a חג shift and a Shabbat shift produce TWO separate rows", () => {
    const rows = hourRows(
      build([shift(...CHAG, { holiday: true }), shift(...SHABBAT)]),
    );
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.label).sort()).toEqual(
      ["שעות חג 150%", "שעות שבת 150%"].sort(),
    );
    for (const r of rows) expect(r.hours).toBe(8);
  });

  test("a manual חג and an imported חג merge into ONE 16h row", () => {
    const imported = { ...shift(...SHABBAT), is_holiday: true };
    const rows = hourRows(build([shift(...CHAG, { holiday: true }), imported]));
    expect(rows).toHaveLength(1);
    expect(rows[0].label).toBe("שעות חג 150%");
    expect(rows[0].hours).toBe(16);
  });

  test("brutoExtra includes חג hours", () => {
    const model = build([shift(...CHAG, { holiday: true })]);
    // 8h × 50 × 1.5 — classified as extra because factor !== 1, matching how
    // h150_shabat is already treated (see the pension-split note in the plan).
    expect(model.brutoExtra).toBe(600);
  });

  test("bruto and neto come from monthlyReport and do not move", () => {
    // The money-safety pin: hour buckets must never feed the authoritative
    // salary figures. calculateSalary's inputs are pay fields only.
    const withChag = build([shift(...CHAG, { holiday: true })]);
    const withoutChag = build([
      shift("2026-04-07T07:00:00", "2026-04-07T15:00:00"),
    ]);
    expect(withChag.bruto).toBe(1234);
    expect(withChag.neto).toBe(1000);
    expect(withChag.bruto).toBe(withoutChag.bruto);
    expect(withChag.neto).toBe(withoutChag.neto);
  });
});

// R7 (2026-09 audit): the PDF printed sick-day rows bucketed by sick_percent,
// but the on-screen model did not, so the modal's rows never summed to the
// bruto printed under them in a month with sick leave.
describe("buildPaycheckModel — sick-day rows", () => {
  const { buildSickDocs } = require("../utils/sickDays");

  test("sick days appear as one row per percent bucket", () => {
    const sick = buildSickDocs({
      startDate: new Date(2026, 3, 6),
      endDate: new Date(2026, 3, 9), // 4 days: 0%, 50%, 50%, 100%
      dailyPay: 400,
      userId: "u",
      baseRate: 50,
    });
    const model = build(sick);
    const sickRows = model.earnings.filter((r) => r.kind === "sick");
    const byPct = Object.fromEntries(sickRows.map((r) => [r.sickPercent, r]));
    expect(byPct[0]).toMatchObject({ qty: 1, amount: 0 });
    expect(byPct[0.5]).toMatchObject({ qty: 2, amount: 400 });
    expect(byPct[1]).toMatchObject({ qty: 1, amount: 400 });
    // Rate column shows the daily rate at that percent.
    expect(byPct[0.5].rate).toBe(200);
  });

  test("no sick days → no sick rows", () => {
    const model = build([shift("2026-04-06T07:00:00", "2026-04-06T15:00:00")]);
    expect(model.earnings.some((r) => r.kind === "sick")).toBe(false);
  });
});
