/* global describe, test, expect */
const { findShiftConflicts, sameDayWindow } = require("../utils/shiftOverlap");

const existing = (start, end, extra = {}) => ({
  $id: `${start}|${end}`,
  start_time: start,
  end_time: end,
  ...extra,
});

describe("findShiftConflicts", () => {
  const day = [
    existing("2026-04-06T07:00:00.000Z", "2026-04-06T15:00:00.000Z"),
    existing("2026-04-06T22:00:00.000Z", "2026-04-06T06:00:00.000Z"), // legacy overnight, end<start
  ];

  test("identical start and end → exact duplicate", () => {
    const r = findShiftConflicts(
      "2026-04-06T07:00:00.000Z",
      "2026-04-06T15:00:00.000Z",
      day,
    );
    expect(r.exact).toBeTruthy();
    expect(r.overlapping).toHaveLength(0);
  });

  test("partial overlap → overlapping, not exact", () => {
    const r = findShiftConflicts(
      "2026-04-06T13:00:00.000Z",
      "2026-04-06T20:00:00.000Z",
      day,
    );
    expect(r.exact).toBeNull();
    expect(r.overlapping).toHaveLength(1);
  });

  test("touching boundaries do not overlap", () => {
    const r = findShiftConflicts(
      "2026-04-06T15:00:00.000Z",
      "2026-04-06T19:00:00.000Z",
      day,
    );
    expect(r.exact).toBeNull();
    expect(r.overlapping).toHaveLength(0);
  });

  test("legacy end<start documents are treated as overnight", () => {
    const r = findShiftConflicts(
      "2026-04-07T01:00:00.000Z",
      "2026-04-07T04:00:00.000Z",
      day,
    );
    expect(r.overlapping).toHaveLength(1);
  });

  test("the document being edited is excluded", () => {
    const r = findShiftConflicts(
      "2026-04-06T07:00:00.000Z",
      "2026-04-06T15:00:00.000Z",
      day,
      { excludeId: day[0].$id },
    );
    expect(r.exact).toBeNull();
    expect(r.overlapping).toHaveLength(0);
  });

  test("sick / vacation / training documents never conflict", () => {
    const r = findShiftConflicts(
      "2026-04-06T07:00:00.000Z",
      "2026-04-06T15:00:00.000Z",
      [
        existing("2026-04-06T07:00:00.000Z", "2026-04-06T15:00:00.000Z", {
          is_sick: true,
        }),
        existing("2026-04-06T07:00:00.000Z", "2026-04-06T15:00:00.000Z", {
          is_vacation: true,
        }),
      ],
    );
    expect(r.exact).toBeNull();
    expect(r.overlapping).toHaveLength(0);
  });
});

describe("sameDayWindow", () => {
  test("covers the previous evening through the next morning so overnight shifts are fetched", () => {
    const { from, to } = sameDayWindow(new Date(2026, 3, 6, 9, 0));
    expect(new Date(from).getTime()).toBeLessThan(
      new Date(2026, 3, 6).getTime(),
    );
    expect(new Date(to).getTime()).toBeGreaterThan(
      new Date(2026, 3, 7).getTime(),
    );
  });
});
