/* global describe, test, expect */
const {
  DEFAULT_SHIFT_TIMES,
  CUSTOMISABLE_TYPES,
  parseHHMM,
  isValidTimeObject,
  formatTimeRange,
  parseUserShiftTimes,
  serialiseUserShiftTimes,
  getShiftTimes,
} = require("../utils/shiftTimes");

describe("parseHHMM", () => {
  test("parses zero-padded times", () => {
    expect(parseHHMM("07:00")).toEqual({ hour: 7, minute: 0 });
    expect(parseHHMM("23:59")).toEqual({ hour: 23, minute: 59 });
  });

  test("parses unpadded times", () => {
    expect(parseHHMM("7:5")).toEqual({ hour: 7, minute: 5 });
    expect(parseHHMM("0:0")).toEqual({ hour: 0, minute: 0 });
  });

  test("returns null for invalid input", () => {
    expect(parseHHMM("")).toBeNull();
    expect(parseHHMM("nope")).toBeNull();
    expect(parseHHMM("24:00")).toBeNull(); // hour out of range
    expect(parseHHMM("12:60")).toBeNull(); // minute out of range
    expect(parseHHMM("12")).toBeNull();
    expect(parseHHMM(null)).toBeNull();
    expect(parseHHMM(undefined)).toBeNull();
    expect(parseHHMM(700)).toBeNull();
  });

  test("trims surrounding whitespace", () => {
    expect(parseHHMM("  07:00  ")).toEqual({ hour: 7, minute: 0 });
  });
});

describe("formatTimeRange", () => {
  test("zero-pads single-digit hours and minutes", () => {
    expect(
      formatTimeRange({ startH: 7, startM: 0, endH: 15, endM: 0 }),
    ).toBe("07:00 - 15:00");
    expect(
      formatTimeRange({ startH: 0, startM: 5, endH: 9, endM: 30 }),
    ).toBe("00:05 - 09:30");
  });
});

describe("isValidTimeObject", () => {
  test("accepts well-formed times", () => {
    expect(
      isValidTimeObject({ startH: 7, startM: 0, endH: 15, endM: 0 }),
    ).toBe(true);
  });

  test("rejects malformed or out-of-range times", () => {
    expect(isValidTimeObject(null)).toBe(false);
    expect(isValidTimeObject({})).toBe(false);
    expect(
      isValidTimeObject({ startH: 24, startM: 0, endH: 15, endM: 0 }),
    ).toBe(false);
    expect(
      isValidTimeObject({ startH: 7, startM: 60, endH: 15, endM: 0 }),
    ).toBe(false);
    expect(
      isValidTimeObject({ startH: -1, startM: 0, endH: 15, endM: 0 }),
    ).toBe(false);
    expect(
      isValidTimeObject({ startH: 7.5, startM: 0, endH: 15, endM: 0 }),
    ).toBe(false);
  });
});

describe("parseUserShiftTimes", () => {
  test("returns defaults for undefined/null/empty/invalid JSON", () => {
    expect(parseUserShiftTimes(undefined)).toEqual(DEFAULT_SHIFT_TIMES);
    expect(parseUserShiftTimes(null)).toEqual(DEFAULT_SHIFT_TIMES);
    expect(parseUserShiftTimes("")).toEqual(DEFAULT_SHIFT_TIMES);
    expect(parseUserShiftTimes("{not json")).toEqual(DEFAULT_SHIFT_TIMES);
    expect(parseUserShiftTimes("null")).toEqual(DEFAULT_SHIFT_TIMES);
  });

  test("merges custom entries with defaults", () => {
    const json = JSON.stringify({
      morning: { startH: 6, startM: 30, endH: 14, endM: 30 },
    });
    const result = parseUserShiftTimes(json);
    expect(result.morning).toEqual({
      startH: 6,
      startM: 30,
      endH: 14,
      endM: 30,
    });
    expect(result.evening).toEqual(DEFAULT_SHIFT_TIMES.evening);
    expect(result.night).toEqual(DEFAULT_SHIFT_TIMES.night);
  });

  test("falls back to default for an invalid custom entry", () => {
    const json = JSON.stringify({
      morning: { startH: 99, startM: 0, endH: 15, endM: 0 }, // invalid hour
    });
    const result = parseUserShiftTimes(json);
    expect(result.morning).toEqual(DEFAULT_SHIFT_TIMES.morning);
  });

  test("ignores unknown shift types", () => {
    const json = JSON.stringify({
      bogus: { startH: 1, startM: 1, endH: 2, endM: 2 },
    });
    expect(parseUserShiftTimes(json)).toEqual(DEFAULT_SHIFT_TIMES);
  });
});

describe("serialiseUserShiftTimes", () => {
  test("returns empty JSON when all entries equal defaults", () => {
    expect(serialiseUserShiftTimes(DEFAULT_SHIFT_TIMES)).toBe("{}");
  });

  test("only serialises entries that differ from defaults", () => {
    const times = {
      ...DEFAULT_SHIFT_TIMES,
      evening: { startH: 16, startM: 0, endH: 0, endM: 0 },
    };
    expect(JSON.parse(serialiseUserShiftTimes(times))).toEqual({
      evening: { startH: 16, startM: 0, endH: 0, endM: 0 },
    });
  });

  test("ignores malformed entries", () => {
    const times = {
      morning: { startH: 99, startM: 0, endH: 15, endM: 0 },
    };
    expect(serialiseUserShiftTimes(times)).toBe("{}");
  });
});

describe("getShiftTimes", () => {
  test("returns the default for a known type with no user prefs", () => {
    expect(getShiftTimes("morning", null)).toEqual(
      DEFAULT_SHIFT_TIMES.morning,
    );
  });

  test("returns the user's custom value when set", () => {
    const json = JSON.stringify({
      evening: { startH: 16, startM: 30, endH: 0, endM: 30 },
    });
    expect(getShiftTimes("evening", json)).toEqual({
      startH: 16,
      startM: 30,
      endH: 0,
      endM: 30,
    });
  });

  test("returns null for unknown shift types not in defaults", () => {
    expect(getShiftTimes("bogus", null)).toBeNull();
  });
});

describe("CUSTOMISABLE_TYPES", () => {
  test("matches DEFAULT_SHIFT_TIMES keys", () => {
    expect([...CUSTOMISABLE_TYPES].sort()).toEqual(
      Object.keys(DEFAULT_SHIFT_TIMES).sort(),
    );
  });
});
