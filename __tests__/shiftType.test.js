// Locks in the morning/evening/night classification used to label shift
// rows. The previous bug had every weekday shift labelled "morning"
// because deriveShiftType called the wrong helper signature; this suite
// covers the boundaries of the default windows + the midnight-wrap.
//
// CJS so it runs under jest without a babel transform for the ESM
// re-export in lib/.
const { deriveShiftType } = require("../utils/shiftType");

// Build a Monday at the requested HH:MM (Jan 5 2026 is a Monday).
// Local-time Date is intentional — deriveShiftType reads getHours() in
// local time, so both ends of the comparison stay in the same zone and
// the test is timezone-stable on any CI runner.
const monAt = (h, m = 0) => ({
  start_time: new Date(2026, 0, 5, h, m).toISOString(),
});

describe("deriveShiftType — weekday time-of-day classification", () => {
  test.each([
    ["07:00", 7, 0, "morning"],
    ["11:00", 11, 0, "morning"],
    ["14:59", 14, 59, "morning"],
    ["15:00", 15, 0, "evening"],
    ["18:00", 18, 0, "evening"],
    ["22:00", 22, 0, "evening"],
    ["22:59", 22, 59, "evening"],
    ["23:00", 23, 0, "night"],
    ["23:30", 23, 30, "night"],
    ["02:00", 2, 0, "night"],
    ["06:00", 6, 0, "night"],
    ["06:59", 6, 59, "night"],
  ])("Monday %s start → %s", (_label, h, m, expected) => {
    expect(deriveShiftType(monAt(h, m), {})).toBe(expected);
  });
});

describe("deriveShiftType — day-of-week + flag overrides", () => {
  test("Friday morning → friday (not morning)", () => {
    const fri = { start_time: new Date(2026, 0, 9, 8, 0).toISOString() };
    expect(deriveShiftType(fri, {})).toBe("friday");
  });
  test("Saturday afternoon → shabbat", () => {
    const sat = { start_time: new Date(2026, 0, 10, 14, 0).toISOString() };
    expect(deriveShiftType(sat, {})).toBe("shabbat");
  });
  test("is_holiday wins over time-of-day", () => {
    const s = { ...monAt(10), is_holiday: true };
    expect(deriveShiftType(s, {})).toBe("holiday");
  });
  test("is_sick wins over everything", () => {
    const s = { ...monAt(10), is_sick: true, is_holiday: true };
    expect(deriveShiftType(s, {})).toBe("sick");
  });
});

describe("deriveShiftType — custom user windows", () => {
  // User pushed morning later and shrunk night to 00–06.
  const prefs = {
    default_shift_times: JSON.stringify({
      morning: { startH: 9, startM: 0, endH: 16, endM: 0 },
      evening: { startH: 16, startM: 0, endH: 22, endM: 0 },
      night: { startH: 22, startM: 0, endH: 9, endM: 0 },
    }),
  };
  test("08:00 with custom night-9→22→9 → night", () => {
    expect(deriveShiftType(monAt(8, 0), prefs)).toBe("night");
  });
  test("16:00 with custom evening-16→22 → evening", () => {
    expect(deriveShiftType(monAt(16, 0), prefs)).toBe("evening");
  });
  test("12:00 with custom morning-9→16 → morning", () => {
    expect(deriveShiftType(monAt(12, 0), prefs)).toBe("morning");
  });
});

describe("deriveShiftType — degenerate / legacy inputs", () => {
  test("missing start_time → morning fallback", () => {
    expect(deriveShiftType({}, {})).toBe("morning");
  });
  test("invalid date string → morning fallback", () => {
    expect(deriveShiftType({ start_time: "not-a-date" }, {})).toBe("morning");
  });
  test("null shift → morning fallback", () => {
    expect(deriveShiftType(null, {})).toBe("morning");
  });
  test("Saturday + is_training → training (flag beats day-of-week)", () => {
    const s = {
      start_time: new Date(2026, 0, 10, 10, 0).toISOString(),
      is_training: true,
    };
    expect(deriveShiftType(s, {})).toBe("training");
  });
  test("equal-start-and-end night window → covers the whole day", () => {
    // Defensive: a user could save night = {23:00 → 23:00}. We treat
    // that as a 24-hour window rather than silently dropping shifts
    // into morning/evening buckets.
    const prefs = {
      default_shift_times: JSON.stringify({
        night: { startH: 23, startM: 0, endH: 23, endM: 0 },
      }),
    };
    expect(deriveShiftType(monAt(2, 0), prefs)).toBe("night");
    expect(deriveShiftType(monAt(14, 0), prefs)).toBe("night");
    expect(deriveShiftType(monAt(23, 30), prefs)).toBe("night");
  });
});
