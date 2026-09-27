/* global describe, test, expect */
const { computeComplianceFlags, LIMITS } = require("../utils/compliance");

const d = (id, start, end, extra = {}) => ({
  $id: id,
  start_time: start,
  end_time: end,
  reg_hours: 8,
  extra_hours: 0,
  ...extra,
});

describe("computeComplianceFlags", () => {
  test("empty → no flags", () => {
    expect(computeComplianceFlags([])).toEqual({
      longDays: [],
      otWeeks: [],
      shortRestWeeks: [],
    });
  });
  test("a 13 h shift is a long day; 12 h exactly is not", () => {
    const f = computeComplianceFlags([
      d("a", "2026-04-06T07:00:00", "2026-04-06T20:00:00"),
      d("b", "2026-04-07T07:00:00", "2026-04-07T19:00:00"),
    ]);
    expect(f.longDays).toEqual(["2026-04-06T07:00:00"]);
  });
  test("legacy end<start counts as overnight, not as a 23 h day", () => {
    const f = computeComplianceFlags([
      d("n", "2026-04-06T22:00:00", "2026-04-06T06:00:00"),
    ]);
    expect(f.longDays).toEqual([]);
  });
  test("a week with 17 overtime hours is flagged; 16 is not", () => {
    const week = [3, 4, 4, 3, 3].map((ot, i) =>
      d(`w${i}`, `2026-04-0${5 + i}T07:00:00`, `2026-04-0${5 + i}T18:00:00`, {
        extra_hours: ot,
      }),
    );
    expect(computeComplianceFlags(week).otWeeks).toEqual([
      { weekKey: "2026-3-5", hours: 17 },
    ]);
    week[0].extra_hours = 2;
    expect(computeComplianceFlags(week).otWeeks).toEqual([]);
  });
  const days = (list, month = "04") =>
    list.map((day) =>
      d(
        `s${month}${day}`,
        `2026-${month}-${String(day).padStart(2, "0")}T07:00:00`,
        `2026-${month}-${String(day).padStart(2, "0")}T15:00:00`,
      ),
    );
  test("a plain Sun–Fri week is NOT flagged: the weekend gap is the rest", () => {
    // Sun 5 .. Fri 10, then Sun 12 .. Fri 17: Fri 15:00 → Sun 07:00 = 40 h
    const twoWeeks = days([5, 6, 7, 8, 9, 10, 12, 13, 14, 15, 16, 17]);
    expect(computeComplianceFlags(twoWeeks).shortRestWeeks).toEqual([]);
  });
  test("seven days straight into the next week → the first week is flagged", () => {
    // Sun 5 .. Sat 11 and Sun 12 .. Tue 14: no gap ≥ 36 h touches week 5–11
    const run = days([5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
    expect(computeComplianceFlags(run).shortRestWeeks).toEqual(["2026-3-5"]);
  });
  test("the last week of the data is never flagged (its following rest is unknown)", () => {
    const run = days([5, 6, 7, 8, 9, 10, 11]);
    expect(computeComplianceFlags(run).shortRestWeeks).toEqual([]);
  });
  test("fewer than six worked days in the week → not evaluated even if dense", () => {
    const run = days([5, 6, 7, 8, 9, 12, 13, 14, 15, 16]);
    expect(computeComplianceFlags(run).shortRestWeeks).toEqual([]);
  });
  test("flat-day docs are ignored", () => {
    const f = computeComplianceFlags([
      d("sick", "2026-04-06T00:00:00", "2026-04-06T23:59:00", {
        is_sick: true,
        extra_hours: 20,
      }),
    ]);
    expect(f).toEqual({ longDays: [], otWeeks: [], shortRestWeeks: [] });
  });
  test("limits are exposed", () => {
    expect(LIMITS).toEqual({
      longDayHours: 12,
      weeklyOtHours: 16,
      restHours: 36,
      restMinWorkedDays: 6,
    });
  });
});
