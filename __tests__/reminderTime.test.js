/* global describe, test, expect */
const { formatHHMM, parseReminderTime } = require("../utils/reminderTime");

describe("formatHHMM", () => {
  test("zero-pads and ignores locale", () => {
    expect(formatHHMM(new Date(2026, 0, 1, 7, 5))).toBe("07:05");
    expect(formatHHMM(new Date(2026, 0, 1, 18, 30))).toBe("18:30");
    expect(formatHHMM(new Date(2026, 0, 1, 0, 0))).toBe("00:00");
  });
});

describe("parseReminderTime", () => {
  test("parses the stored HH:MM", () => {
    expect(parseReminderTime("18:30")).toEqual({ hour: 18, minute: 30 });
  });
  test("tolerates legacy locale strings", () => {
    expect(parseReminderTime("6:05 PM")).toEqual({ hour: 18, minute: 5 });
    expect(parseReminderTime("24:00")).toEqual({ hour: 0, minute: 0 });
  });
  test("returns null on junk", () => {
    expect(parseReminderTime("")).toBeNull();
    expect(parseReminderTime(undefined)).toBeNull();
    expect(parseReminderTime("noon")).toBeNull();
  });
});
