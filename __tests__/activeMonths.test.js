/* global describe, test, expect */
const { statsFromDocs, applyStatsEvent } = require("../utils/activeMonths");

const doc = (y, m, d = 1) => ({ start_time: new Date(y, m, d).toISOString() });

describe("statsFromDocs", () => {
  test("counts docs and distinct local months", () => {
    const s = statsFromDocs([
      doc(2026, 2),
      doc(2026, 2, 15),
      doc(2026, 3),
      { start_time: "junk" },
    ]);
    expect(s.total).toBe(4);
    expect(s.months.sort()).toEqual(["2026-2", "2026-3"]);
  });
  test("empty", () => {
    expect(statsFromDocs([])).toEqual({ total: 0, months: [] });
  });
});

describe("applyStatsEvent", () => {
  const base = { total: 5, months: ["2026-2", "2026-3"] };
  test("create adds the month and increments", () => {
    const next = applyStatsEvent(base, "create", "2026-4");
    expect(next.total).toBe(6);
    expect(next.months.sort()).toEqual(["2026-2", "2026-3", "2026-4"]);
    expect(next.dirty).toBeFalsy();
  });
  test("create in a known month only increments", () => {
    const next = applyStatsEvent(base, "create", "2026-3");
    expect(next.total).toBe(6);
    expect(next.months).toHaveLength(2);
  });
  test("delete decrements and marks dirty (a month may have emptied)", () => {
    const next = applyStatsEvent(base, "delete", "2026-3");
    expect(next.total).toBe(4);
    expect(next.dirty).toBe(true);
  });
  test("update into an unseen month adds it and marks dirty (source month may have emptied)", () => {
    const next = applyStatsEvent(base, "update", "2026-7");
    expect(next.months).toContain("2026-7");
    expect(next.total).toBe(5);
    expect(next.dirty).toBe(true);
  });
  test("update inside a known month changes nothing; unknown month key on create still counts", () => {
    expect(applyStatsEvent(base, "update", "2026-3")).toEqual(base);
    expect(applyStatsEvent(base, "create", null).total).toBe(6);
  });
  test("never mutates the input", () => {
    applyStatsEvent(base, "create", "2026-9");
    expect(base.months).toHaveLength(2);
    expect(base.total).toBe(5);
  });
});
