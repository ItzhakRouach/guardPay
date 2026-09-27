/* global describe, test, expect */
const {
  monthKeyOf,
  monthRangeIso,
  eventKind,
  eventMonthKey,
  isMyEvent,
} = require("../utils/shiftsCache");

describe("monthKeyOf", () => {
  test("local year-month key from Date or ISO", () => {
    expect(monthKeyOf(new Date(2026, 3, 6, 9))).toBe("2026-3");
    expect(monthKeyOf(new Date(2026, 3, 6, 9).toISOString())).toBe("2026-3");
  });
  test("null on junk", () => {
    expect(monthKeyOf(null)).toBeNull();
    expect(monthKeyOf("not a date")).toBeNull();
  });
});

describe("monthRangeIso", () => {
  test("covers the whole local month, same bounds useShift always used", () => {
    const { start, end } = monthRangeIso(2026, 3);
    expect(new Date(start).getTime()).toBe(new Date(2026, 3, 1).getTime());
    expect(new Date(end).getTime()).toBe(
      new Date(2026, 4, 0, 23, 59, 59).getTime(),
    );
  });
});

describe("realtime event helpers", () => {
  const ev = (suffix, payload) => ({
    events: [`databases.db.collections.shifts.documents.abc.${suffix}`],
    payload,
  });
  test("eventKind from the events array", () => {
    expect(eventKind(ev("create", {}))).toBe("create");
    expect(eventKind(ev("update", {}))).toBe("update");
    expect(eventKind(ev("delete", {}))).toBe("delete");
    expect(eventKind({ events: [] })).toBeNull();
    expect(eventKind(null)).toBeNull();
  });
  test("eventMonthKey from the payload's start_time", () => {
    expect(
      eventMonthKey(
        ev("create", { start_time: new Date(2026, 0, 31, 23).toISOString() }),
      ),
    ).toBe("2026-0");
    expect(eventMonthKey(ev("create", {}))).toBeNull();
  });
  test("isMyEvent matches on payload.user_id only", () => {
    expect(isMyEvent(ev("create", { user_id: "u1" }), "u1")).toBe(true);
    expect(isMyEvent(ev("delete", { user_id: "u2" }), "u1")).toBe(false);
    expect(isMyEvent(ev("delete", {}), "u1")).toBe(false);
  });
});
