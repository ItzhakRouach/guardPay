/* global describe, test, expect */
const {
  SWATCHES,
  DEFAULT_COLORS,
  parseUserColors,
  resolveTint,
  serialiseUserColors,
} = require("../utils/shiftColors");

describe("parseUserColors", () => {
  test("returns defaults for undefined/null/empty", () => {
    expect(parseUserColors(undefined)).toEqual(DEFAULT_COLORS);
    expect(parseUserColors(null)).toEqual(DEFAULT_COLORS);
    expect(parseUserColors("")).toEqual(DEFAULT_COLORS);
  });

  test("returns defaults for invalid JSON", () => {
    expect(parseUserColors("{not json")).toEqual(DEFAULT_COLORS);
    expect(parseUserColors("null")).toEqual(DEFAULT_COLORS);
  });

  test("merges partial JSON with defaults", () => {
    const result = parseUserColors('{"friday":"#ABCDEF"}');
    expect(result.friday).toBe("#ABCDEF");
    expect(result.saturday).toBe(DEFAULT_COLORS.saturday);
    expect(result.training).toBe(DEFAULT_COLORS.training);
    expect(result.holiday).toBe(DEFAULT_COLORS.holiday);
  });

  test("accepts a pre-parsed object", () => {
    const result = parseUserColors({ holiday: "#FFFFFF" });
    expect(result.holiday).toBe("#FFFFFF");
    expect(result.friday).toBe(DEFAULT_COLORS.friday);
  });
});

describe("resolveTint priority", () => {
  // Pick a known Friday (day 5) and Saturday (day 6) ISO date for tests.
  const friday = "2026-05-22T08:00:00"; // Fri
  const saturday = "2026-05-23T08:00:00"; // Sat
  const monday = "2026-05-25T08:00:00"; // Mon

  test("returns null for a plain weekday shift", () => {
    expect(resolveTint({ start_time: monday }, null, "light")).toBeNull();
  });

  test("Friday weekday returns friday tint", () => {
    expect(resolveTint({ start_time: friday }, null, "light")).toBe(
      DEFAULT_COLORS.friday.toUpperCase(),
    );
  });

  test("Saturday weekday returns saturday tint", () => {
    expect(resolveTint({ start_time: saturday }, null, "light")).toBe(
      DEFAULT_COLORS.saturday.toUpperCase(),
    );
  });

  test("is_holiday wins over Saturday classification", () => {
    expect(
      resolveTint({ start_time: saturday, is_holiday: true }, null, "light"),
    ).toBe(DEFAULT_COLORS.holiday.toUpperCase());
  });

  test("is_training wins over Friday classification", () => {
    expect(
      resolveTint({ start_time: friday, is_training: true }, null, "light"),
    ).toBe(DEFAULT_COLORS.training.toUpperCase());
  });

  test("is_holiday wins over is_training", () => {
    expect(
      resolveTint(
        { start_time: friday, is_training: true, is_holiday: true },
        null,
        "light",
      ),
    ).toBe(DEFAULT_COLORS.holiday.toUpperCase());
  });
});

describe("resolveTint user override + dark mode", () => {
  const saturday = "2026-05-23T08:00:00";

  test("uses the user's custom color when set", () => {
    const userColors = JSON.stringify({ saturday: "#ECFCCB" }); // sage
    expect(resolveTint({ start_time: saturday }, userColors, "light")).toBe(
      "#ECFCCB",
    );
  });

  test("dark mode swaps to the paired dark hex when light hex is a known swatch", () => {
    expect(resolveTint({ start_time: saturday }, null, "dark")).toBe(
      // saturday default is lilac; dark counterpart from SWATCHES table
      SWATCHES.find((s) => s.name === "lilac").dark,
    );
  });

  test("dark mode falls back to the same hex if the user picked something off-palette", () => {
    const userColors = JSON.stringify({ saturday: "#123456" });
    expect(resolveTint({ start_time: saturday }, userColors, "dark")).toBe(
      "#123456",
    );
  });

  test("missing start_time returns null", () => {
    expect(resolveTint({}, null, "light")).toBeNull();
    expect(resolveTint(null, null, "light")).toBeNull();
  });
});

describe("serialiseUserColors", () => {
  test("returns empty JSON when all values equal defaults", () => {
    expect(serialiseUserColors(DEFAULT_COLORS)).toBe("{}");
  });

  test("only serialises changed entries", () => {
    const colors = { ...DEFAULT_COLORS, holiday: "#ABCDEF" };
    expect(JSON.parse(serialiseUserColors(colors))).toEqual({
      holiday: "#ABCDEF",
    });
  });

  test("case-insensitive comparison against defaults", () => {
    const colors = { ...DEFAULT_COLORS, friday: DEFAULT_COLORS.friday.toLowerCase() };
    expect(serialiseUserColors(colors)).toBe("{}");
  });
});
