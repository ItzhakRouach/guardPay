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
  test("six worked days with no 36 h gap → short rest; five days → not evaluated", () => {
    const six = [5, 6, 7, 8, 9, 10].map((day) =>
      d(
        `s${day}`,
        `2026-04-${String(day).padStart(2, "0")}T07:00:00`,
        `2026-04-${String(day).padStart(2, "0")}T15:00:00`,
      ),
    );
    expect(computeComplianceFlags(six).shortRestWeeks).toEqual(["2026-3-5"]);
    expect(computeComplianceFlags(six.slice(0, 5)).shortRestWeeks).toEqual([]);
  });
  test("six worked days but one 40 h gap → no short-rest flag", () => {
    const six = [5, 6, 7, 9, 10, 11].map((day) =>
      d(
        `s${day}`,
        `2026-04-${String(day).padStart(2, "0")}T07:00:00`,
        `2026-04-${String(day).padStart(2, "0")}T15:00:00`,
      ),
    );
    expect(computeComplianceFlags(six).shortRestWeeks).toEqual([]);
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
