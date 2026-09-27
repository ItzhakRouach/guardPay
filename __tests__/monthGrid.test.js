/* global describe, test, expect */
const {
  monthShape,
  weekOfMonth,
  weekIndexOfDay,
  bucketByDay,
  dayTotals,
} = require("../utils/monthGrid");
const { computeShiftDoc } = require("../utils/salaryLogic");

const doc = (id, start, end, extra = {}) => ({
  $id: id,
  ...computeShiftDoc({
    startTime: start,
    endTime: end,
    baseRate: 54,
    travelRate: 40,
    type: "morning",
    isHoliday: false,
  }),
  ...extra,
});

describe("monthShape", () => {
  test("September 2026 starts on a Tuesday and needs five rows", () => {
    const s = monthShape(2026, 8);
    expect(s.firstWeekday).toBe(2);
    expect(s.daysInMonth).toBe(30);
    expect(s.weeksInMonth).toBe(5);
    expect(s.cells).toHaveLength(35);
    expect(s.cells.slice(0, 3)).toEqual([null, null, 1]);
    expect(s.cells[31]).toBe(30);
    expect(s.cells[32]).toBeNull();
  });

  test("August 2026 starts on a Saturday and needs six rows", () => {
    const s = monthShape(2026, 7);
    expect(s.firstWeekday).toBe(6);
    expect(s.daysInMonth).toBe(31);
    expect(s.weeksInMonth).toBe(6);
    expect(s.cells).toHaveLength(42);
    expect(s.cells[6]).toBe(1); // Saturday column of the first row
    expect(s.cells[7]).toBe(2); // Sunday of the second row
  });

  test("February 2026 has 28 days and fits exactly four rows", () => {
    const s = monthShape(2026, 1);
    expect(s.firstWeekday).toBe(0);
    expect(s.daysInMonth).toBe(28);
    expect(s.weeksInMonth).toBe(4);
    expect(s.cells).toHaveLength(28);
    expect(s.cells[0]).toBe(1);
    expect(s.cells[27]).toBe(28);
  });

  test("February 2028 is a leap month", () => {
    expect(monthShape(2028, 1).daysInMonth).toBe(29);
  });

  test("a 30-day month is still handled", () => {
    expect(monthShape(2026, 3).daysInMonth).toBe(30); // April
  });

  test("every day appears exactly once, in order", () => {
    for (const [y, m] of [
      [2026, 7],
      [2026, 8],
      [2026, 1],
      [2028, 1],
    ]) {
      const s = monthShape(y, m);
      const days = s.cells.filter((c) => c !== null);
      expect(days).toEqual(
        Array.from({ length: s.daysInMonth }, (_, i) => i + 1),
      );
    }
  });
});

describe("weekOfMonth agrees with the grid", () => {
  test("1-indexed, matching what the Shifts list has always shown", () => {
    expect(weekOfMonth(new Date(2026, 8, 1))).toBe(1);
    expect(weekOfMonth(new Date(2026, 8, 5))).toBe(1);
    expect(weekOfMonth(new Date(2026, 8, 6))).toBe(2);
    expect(weekOfMonth(new Date(2026, 8, 30))).toBe(5);
  });

  test("weekIndexOfDay is the 0-indexed row a day lands in", () => {
    const s = monthShape(2026, 8);
    for (let d = 1; d <= s.daysInMonth; d += 1) {
      const row = weekIndexOfDay(d, s.firstWeekday);
      expect(s.cells[row * 7 + ((s.firstWeekday + d - 1) % 7)]).toBe(d);
      expect(row).toBe(weekOfMonth(new Date(2026, 8, d)) - 1);
    }
  });
});

describe("bucketByDay", () => {
  test("keys on the local day the shift STARTS, so an overnight shift stays put", () => {
    const overnight = doc("n", "2026-09-27T19:00:00", "2026-09-28T07:00:00");
    const b = bucketByDay([overnight]);
    expect(Object.keys(b)).toEqual(["27"]);
    expect(b[27]).toHaveLength(1);
  });

  test("a legacy document stored with end before start still lands on its start day", () => {
    const legacy = {
      ...doc("l", "2026-09-27T22:00:00", "2026-09-28T06:00:00"),
      end_time: "2026-09-27T06:00:00",
    };
    expect(Object.keys(bucketByDay([legacy]))).toEqual(["27"]);
  });

  test("two documents on one day are both kept, in start order", () => {
    const vac = doc("v", "2026-09-21T00:00:00", "2026-09-21T23:59:00", {
      is_vacation: true,
    });
    const hol = doc("h", "2026-09-21T15:00:00", "2026-09-21T23:00:00");
    const b = bucketByDay([hol, vac]);
    expect(b[21].map((d) => d.$id)).toEqual(["v", "h"]);
  });

  test("documents with an unreadable date are dropped, not crashed on", () => {
    const bad = {
      ...doc("b", "2026-09-10T07:00:00", "2026-09-10T15:00:00"),
      start_time: "nope",
    };
    expect(
      bucketByDay([
        bad,
        doc("g", "2026-09-11T07:00:00", "2026-09-11T15:00:00"),
      ]),
    ).toEqual(expect.objectContaining({ 11: expect.any(Array) }));
    expect(Object.keys(bucketByDay([bad]))).toEqual([]);
  });

  test("empty and junk input give an empty map", () => {
    expect(bucketByDay([])).toEqual({});
    expect(bucketByDay(null)).toEqual({});
  });
});

describe("dayTotals", () => {
  test("sums hours and bruto for one day through docBruto", () => {
    const a = doc("a", "2026-09-22T07:00:00", "2026-09-22T19:00:00");
    const t = dayTotals([a]);
    expect(t.count).toBe(1);
    expect(t.hours).toBeCloseTo(a.reg_hours + a.extra_hours, 6);
    expect(t.bruto).toBeCloseTo(a.total_amount, 6);
  });

  test("a training day's travel is included, matching the month total", () => {
    const training = {
      $id: "t",
      ...computeShiftDoc({
        startTime: "2026-09-22T07:00:00",
        endTime: "2026-09-22T15:00:00",
        baseRate: 54,
        travelRate: 40,
        type: "training",
      }),
    };
    expect(dayTotals([training]).bruto).toBeCloseTo(54 * 8 + 40, 6);
  });

  test("no shifts is a zeroed total, never undefined", () => {
    expect(dayTotals([])).toEqual({ count: 0, hours: 0, bruto: 0 });
    expect(dayTotals(undefined)).toEqual({ count: 0, hours: 0, bruto: 0 });
  });
});
