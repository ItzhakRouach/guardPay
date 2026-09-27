/* global describe, test, expect */
const { buildShiftBreakdown } = require("../utils/shiftBreakdown");
const { computeShiftDoc } = require("../utils/salaryLogic");
const { buildSickDocs } = require("../utils/sickDays");

const doc = (start, end, opts = {}) =>
  computeShiftDoc({
    startTime: start,
    endTime: end,
    baseRate: 40,
    travelRate: 20,
    type: opts.type || "regular",
    isHoliday: !!opts.holiday,
  });

describe("buildShiftBreakdown — worked shifts", () => {
  test("weekday 10h: 8h regular, 2h at 125%, travel, totals reconcile", () => {
    const b = buildShiftBreakdown(
      doc("2026-04-06T07:00:00", "2026-04-06T17:00:00"),
    );
    expect(b.kind).toBe("worked");
    expect(b.durationHours).toBe(10);
    expect(b.baseRate).toBe(40);

    const byKey = Object.fromEntries(b.hourRows.map((r) => [r.labelKey, r]));
    expect(byKey["shiftDetails.regHours"]).toMatchObject({
      hours: 8,
      percent: 100,
      rate: 40,
      amount: 320,
    });
    expect(byKey["shiftDetails.h125"]).toMatchObject({
      hours: 2,
      percent: 125,
      rate: 50,
      amount: 100,
    });
    // Zero buckets are omitted.
    expect(byKey["shiftDetails.h150"]).toBeUndefined();

    expect(b.regularPay).toBe(320);
    expect(b.overtimePay).toBe(100);
    expect(b.travelPay).toBe(20);
    expect(b.total).toBe(440);
    // The rows must explain the stored total exactly.
    const rowSum = b.hourRows.reduce((a, r) => a + r.amount, 0);
    expect(rowSum + b.travelPay).toBeCloseTo(b.total, 6);
  });

  test("weekday 13h: 8h + 2h@125 + 3h@150", () => {
    const b = buildShiftBreakdown(
      doc("2026-04-06T07:00:00", "2026-04-06T20:00:00"),
    );
    const byKey = Object.fromEntries(b.hourRows.map((r) => [r.labelKey, r]));
    expect(byKey["shiftDetails.h125"].hours).toBe(2);
    expect(byKey["shiftDetails.h150"]).toMatchObject({
      hours: 3,
      percent: 150,
    });
    expect(b.overtimeHours).toBe(5);
    expect(b.regularHours).toBe(8);
  });

  test("Shabbat shift labels the 150/175/200 rows as Shabbat", () => {
    // Saturday 07:00–19:00 → 8h@150 (regular cap), 2h@175, 2h@200
    const b = buildShiftBreakdown(
      doc("2026-04-11T07:00:00", "2026-04-11T19:00:00"),
    );
    const keys = b.hourRows.map((r) => r.labelKey);
    expect(keys).toEqual(
      expect.arrayContaining([
        "shiftDetails.h150Shabat",
        "shiftDetails.h175",
        "shiftDetails.h200",
      ]),
    );
    expect(keys).not.toContain("shiftDetails.h150Holiday");
    // 150% inside the regular cap counts as regular hours (matches
    // monthlyTotals.totalReg) but at the premium rate.
    expect(b.regularHours).toBe(8);
    expect(b.overtimeHours).toBe(4);
  });

  test("חג shift labels the same rows as holiday", () => {
    const b = buildShiftBreakdown(
      doc("2026-04-06T07:00:00", "2026-04-06T19:00:00", { holiday: true }),
    );
    const keys = b.hourRows.map((r) => r.labelKey);
    expect(keys).toEqual(
      expect.arrayContaining([
        "shiftDetails.h150Holiday",
        "shiftDetails.h175Holiday",
        "shiftDetails.h200Holiday",
      ]),
    );
  });

  test("an imported חג shift (hours in Shabbat fields + is_holiday) labels by the flag", () => {
    const imported = {
      ...doc("2026-04-11T07:00:00", "2026-04-11T15:00:00"),
      is_holiday: true,
    };
    const b = buildShiftBreakdown(imported);
    expect(b.hourRows[0].labelKey).toBe("shiftDetails.h150Holiday");
  });

  test("overnight shift stored with end < start still reports a positive duration", () => {
    const stored = {
      ...doc("2026-04-06T22:00:00", "2026-04-07T06:00:00"),
      // The legacy writer kept the end on the start's calendar day.
      end_time: "2026-04-06T06:00:00",
    };
    const b = buildShiftBreakdown(stored);
    expect(b.durationHours).toBe(8);
  });

  test("night shift: 7h regular cap then overtime", () => {
    const b = buildShiftBreakdown(
      doc("2026-04-06T22:00:00", "2026-04-07T06:00:00"),
    );
    expect(b.regularHours).toBe(7);
    expect(b.overtimeHours).toBe(1);
    expect(b.isNight).toBe(true);
  });
});

describe("buildShiftBreakdown — flat-day documents", () => {
  test("training day: kind, flat 8h pay, travel", () => {
    const b = buildShiftBreakdown(
      doc("2026-04-06T07:00:00", "2026-04-06T15:00:00", { type: "training" }),
    );
    expect(b.kind).toBe("training");
    expect(b.hourRows).toEqual([]);
    expect(b.flatDayPay).toBe(320);
    expect(b.travelPay).toBe(20);
    // Same figure the month reducer counts for this day (flat pay + travel).
    expect(b.total).toBe(340);
  });

  test("vacation day", () => {
    const b = buildShiftBreakdown(
      doc("2026-04-06T07:00:00", "2026-04-06T15:00:00", { type: "vacation" }),
    );
    expect(b.kind).toBe("vacation");
    expect(b.flatDayPay).toBe(320);
  });

  test("sick day exposes the percent", () => {
    const [d1, d2] = buildSickDocs({
      startDate: new Date(2026, 3, 6),
      endDate: new Date(2026, 3, 7),
      dailyPay: 320,
      userId: "u",
      baseRate: 40,
    });
    expect(buildShiftBreakdown(d1)).toMatchObject({
      kind: "sick",
      sickPercent: 0,
    });
    expect(buildShiftBreakdown(d2)).toMatchObject({
      kind: "sick",
      sickPercent: 0.5,
    });
  });

  test("never throws on a null or empty document", () => {
    expect(buildShiftBreakdown(null)).toBeNull();
    expect(buildShiftBreakdown({})).toMatchObject({ kind: "worked", total: 0 });
  });
});
