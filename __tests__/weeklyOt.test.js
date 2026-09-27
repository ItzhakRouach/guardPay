/* global describe, test, expect */
const {
  calculateShiftPay,
  computeShiftDoc,
  DEFAULT_CALC_RULES,
} = require("../utils/salaryLogic");

const RATE = 40;
const shift = (start, end, rules, holiday = false) =>
  calculateShiftPay(start, end, RATE, 0, holiday, rules);
const weekly = (before, extra = {}) => ({
  ...DEFAULT_CALC_RULES,
  weeklyRegularBefore: before,
  ...extra,
});

// --- Backward compatibility: the gate for shipping ---------------------
describe("calculateShiftPay — rules omitted is byte-identical to explicit defaults", () => {
  const fixtures = [
    ["2026-04-06T07:00:00", "2026-04-06T15:00:00", false], // weekday 8h
    ["2026-04-06T07:00:00", "2026-04-06T19:00:00", false], // weekday 12h
    ["2026-04-06T22:00:00", "2026-04-07T06:00:00", false], // night 8h
    ["2026-04-06T22:00:00", "2026-04-06T06:00:00", false], // legacy end<start
    ["2026-04-10T14:00:00", "2026-04-10T23:00:00", false], // Friday into weekend
    ["2026-04-11T07:00:00", "2026-04-11T19:00:00", false], // Saturday 12h
    ["2026-04-11T20:00:00", "2026-04-12T08:00:00", false], // Sat night across Sunday 04:00 cutoff
    ["2026-04-06T07:00:00", "2026-04-06T19:00:00", true], // holiday 12h
  ];
  test.each(fixtures)("%s → %s (holiday=%s)", (s, e, h) => {
    const a = calculateShiftPay(s, e, RATE, 22.6, h);
    const b = calculateShiftPay(s, e, RATE, 22.6, h, { ...DEFAULT_CALC_RULES });
    const c = calculateShiftPay(s, e, RATE, 22.6, h, undefined);
    expect(b).toEqual(a);
    expect(c).toEqual(a);
  });
});

// --- Weekly rule ------------------------------------------------------
describe("calculateShiftPay — weekly cap (42 h of regular hours)", () => {
  test("40 h already used: 8 h shift → 2 h regular, then 2 h @125, 4 h @150", () => {
    const r = shift("2026-04-10T07:00:00", "2026-04-10T15:00:00", weekly(40));
    expect(r.h100_hours).toBe(2);
    expect(r.h125_extra_hours).toBe(2);
    expect(r.h150_extra_hours).toBe(4);
    expect(r.reg_hours).toBe(2);
    expect(r.extra_hours).toBe(6);
    expect(r.reg_pay_amount).toBe(80);
    expect(r.extra_pay_amount).toBe(2 * 50 + 4 * 60);
    expect(r.total_amount).toBe(80 + 100 + 240);
  });
  test("daily and weekly merge: 40 h used, 10 h shift → 2 regular + 8 OT (2@125, 6@150)", () => {
    const r = shift("2026-04-06T07:00:00", "2026-04-06T17:00:00", weekly(40));
    expect(r.h100_hours).toBe(2);
    expect(r.h125_extra_hours).toBe(2);
    expect(r.h150_extra_hours).toBe(6);
  });
  test("under the cap the weekly rule changes nothing", () => {
    const a = shift("2026-04-06T07:00:00", "2026-04-06T17:00:00");
    const b = shift("2026-04-06T07:00:00", "2026-04-06T17:00:00", weekly(24));
    expect(b).toEqual(a);
  });
  test("weeklyRegularBefore 0 (first shift of the week) equals no weekly rule for a normal day", () => {
    const a = shift("2026-04-06T07:00:00", "2026-04-06T15:00:00");
    const b = shift("2026-04-06T07:00:00", "2026-04-06T15:00:00", weekly(0));
    expect(b).toEqual(a);
  });
  test("fractional weekly remainder: 41.6 h used → 0.4 h regular then OT, exact", () => {
    const r = shift("2026-04-06T07:00:00", "2026-04-06T15:00:00", weekly(41.6));
    expect(r.h100_hours).toBeCloseTo(0.4, 6);
    expect(r.h125_extra_hours).toBeCloseTo(2, 6);
    expect(r.h150_extra_hours).toBeCloseTo(5.6, 6);
    expect(r.reg_hours + r.extra_hours).toBeCloseTo(8, 6);
  });
  test("cap already exhausted: whole shift is OT, tiered 2 then rest", () => {
    const r = shift("2026-04-06T07:00:00", "2026-04-06T15:00:00", weekly(42));
    expect(r.h100_hours).toBe(0);
    expect(r.h125_extra_hours).toBe(2);
    expect(r.h150_extra_hours).toBe(6);
  });
  test("Shabbat shift past the cap pays 175/200 (150 inside the regular portion)", () => {
    const r = shift("2026-04-11T07:00:00", "2026-04-11T15:00:00", weekly(41));
    expect(r.h150_shabat).toBe(1);
    expect(r.h175_extra_hours).toBe(2);
    expect(r.h200_extra_hours).toBe(5);
  });
  test("holiday shift past the cap lands in the *_holiday buckets", () => {
    const r = shift(
      "2026-04-06T07:00:00",
      "2026-04-06T15:00:00",
      weekly(41),
      true,
    );
    expect(r.h150_holiday).toBe(1);
    expect(r.h175_holiday).toBe(2);
    expect(r.h200_holiday).toBe(5);
    expect(r.h150_shabat + r.h175_extra_hours + r.h200_extra_hours).toBe(0);
  });
  test("night shift: 7 h daily cap still applies alongside the weekly cap", () => {
    const r = shift("2026-04-06T22:00:00", "2026-04-07T06:00:00", weekly(38));
    expect(r.h100_hours).toBe(4);
    expect(r.h125_extra_hours).toBe(2);
    expect(r.h150_extra_hours).toBe(2);
  });
});

// --- Daily norm 8.6 ---------------------------------------------------
describe("calculateShiftPay — daily norm 8.6", () => {
  const d86 = (before = null) => ({
    ...DEFAULT_CALC_RULES,
    dailyRegularHours: 8.6,
    weeklyRegularBefore: before,
  });
  test("9 h shift → 8.6 regular, 0.4 OT @125", () => {
    const r = shift("2026-04-06T07:00:00", "2026-04-06T16:00:00", d86());
    expect(r.h100_hours).toBeCloseTo(8.6, 6);
    expect(r.h125_extra_hours).toBeCloseTo(0.4, 6);
    expect(r.reg_hours).toBeCloseTo(8.6, 6);
  });
  test("8 h shift → all regular", () => {
    const r = shift("2026-04-06T07:00:00", "2026-04-06T15:00:00", d86());
    expect(r.h100_hours).toBe(8);
    expect(r.extra_hours).toBe(0);
  });
  test("11 h shift → 8.6 + 2 @125 + 0.4 @150", () => {
    const r = shift("2026-04-06T07:00:00", "2026-04-06T18:00:00", d86());
    expect(r.h125_extra_hours).toBeCloseTo(2, 6);
    expect(r.h150_extra_hours).toBeCloseTo(0.4, 6);
  });
  test("night shift ignores the 8.6 norm (7 h cap)", () => {
    const r = shift("2026-04-06T22:00:00", "2026-04-07T07:00:00", d86());
    expect(r.h100_hours).toBe(7);
  });
});

// --- Midnight split ---------------------------------------------------
describe("calculateShiftPay — midnight split", () => {
  const split = { ...DEFAULT_CALC_RULES, midnightSplit: true };
  test("20:00–06:00 continuous (default): 7 regular (night) + 2@125 + 1@150", () => {
    const r = shift("2026-04-06T20:00:00", "2026-04-07T06:00:00");
    expect(r.h100_hours).toBe(7);
    expect(r.h125_extra_hours).toBe(2);
    expect(r.h150_extra_hours).toBe(1);
  });
  test("20:00–06:00 split: two work days of 4 h + 6 h, each under the 7 h night cap → all regular", () => {
    const r = shift("2026-04-06T20:00:00", "2026-04-07T06:00:00", split);
    expect(r.h100_hours).toBe(10);
    expect(r.extra_hours).toBe(0);
  });
  test("split resets the OT tier at midnight: 12:00–04:00 (night, cap 7) → 7+2@125+3@150 before midnight, 4 regular after", () => {
    const r = shift("2026-04-06T12:00:00", "2026-04-07T04:00:00", split);
    expect(r.h100_hours).toBe(11);
    expect(r.h125_extra_hours).toBe(2);
    expect(r.h150_extra_hours).toBe(3);
  });
  test("split + weekly: the weekly total keeps running across midnight", () => {
    const r = shift("2026-04-06T20:00:00", "2026-04-07T06:00:00", {
      ...split,
      weeklyRegularBefore: 36,
    });
    expect(r.h100_hours).toBe(6);
    expect(r.h125_extra_hours).toBe(2);
    expect(r.h150_extra_hours).toBe(2);
  });
});

describe("computeShiftDoc — rules and weekly_regular_before", () => {
  const base = {
    startTime: "2026-04-10T07:00:00",
    endTime: "2026-04-10T15:00:00",
    baseRate: RATE,
    travelRate: 0,
    type: "morning",
    isHoliday: false,
  };
  test("no rules → no weekly_regular_before key, numbers as before", () => {
    const doc = computeShiftDoc(base);
    expect("weekly_regular_before" in doc).toBe(false);
    expect(doc.h100_hours).toBe(8);
  });
  test("weekly rules → field recorded and brackets shift", () => {
    const doc = computeShiftDoc({ ...base, rules: weekly(40) });
    expect(doc.weekly_regular_before).toBe(40);
    expect(doc.h100_hours).toBe(2);
    expect(doc.h125_extra_hours).toBe(2);
  });
  test("weekly off (null) → key absent even with rules object", () => {
    const doc = computeShiftDoc({ ...base, rules: { ...DEFAULT_CALC_RULES } });
    expect("weekly_regular_before" in doc).toBe(false);
  });
  test("training days ignore rules and never carry the field", () => {
    const doc = computeShiftDoc({
      ...base,
      type: "training",
      rules: weekly(40),
    });
    expect(doc.is_training).toBe(true);
    expect("weekly_regular_before" in doc).toBe(false);
    expect(doc.total_amount).toBe(RATE * 8);
  });
});
