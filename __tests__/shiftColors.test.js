/* global describe, test, expect */
const {
  SWATCHES,
  DEFAULT_COLORS,
  parseUserColors,
  resolveTint,
  serialiseUserColors,
} = require("../utils/shiftColors");

describe("SWATCHES palette", () => {
  test("each swatch exposes a name and a single hex (no per-mode variant)", () => {
    expect(SWATCHES.length).toBe(8);
    for (const s of SWATCHES) {
      expect(typeof s.name).toBe("string");
      expect(s.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(s).not.toHaveProperty("light");
      expect(s).not.toHaveProperty("dark");
    }
  });

  test("default colors all resolve to a swatch in the palette", () => {
    const palette = new Set(SWATCHES.map((s) => s.hex.toUpperCase()));
    for (const key of Object.keys(DEFAULT_COLORS)) {
      expect(palette.has(DEFAULT_COLORS[key].toUpperCase())).toBe(true);
    }
  });
});

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
  const friday = "2026-05-22T08:00:00";
  const saturday = "2026-05-23T08:00:00";
  const monday = "2026-05-25T08:00:00";

  test("returns null for a plain weekday shift", () => {
    expect(resolveTint({ start_time: monday }, null)).toBeNull();
  });

  test("Friday weekday returns friday tint", () => {
    expect(resolveTint({ start_time: friday }, null)).toBe(
      DEFAULT_COLORS.friday,
    );
  });

  test("Saturday weekday returns saturday tint", () => {
    expect(resolveTint({ start_time: saturday }, null)).toBe(
      DEFAULT_COLORS.saturday,
    );
  });

  test("is_holiday wins over Saturday classification", () => {
    expect(
      resolveTint({ start_time: saturday, is_holiday: true }, null),
    ).toBe(DEFAULT_COLORS.holiday);
  });

  test("is_training wins over Friday classification", () => {
    expect(
      resolveTint({ start_time: friday, is_training: true }, null),
    ).toBe(DEFAULT_COLORS.training);
  });

  test("is_holiday wins over is_training", () => {
    expect(
      resolveTint(
        { start_time: friday, is_training: true, is_holiday: true },
        null,
      ),
    ).toBe(DEFAULT_COLORS.holiday);
  });

  test("uses the user's custom color when set", () => {
    const userColors = JSON.stringify({ saturday: "#F7FEE7" }); // sage
    expect(resolveTint({ start_time: saturday }, userColors)).toBe("#F7FEE7");
  });

  test("missing start_time returns null", () => {
    expect(resolveTint({}, null)).toBeNull();
    expect(resolveTint(null, null)).toBeNull();
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
    const colors = {
      ...DEFAULT_COLORS,
      friday: DEFAULT_COLORS.friday.toLowerCase(),
    };
    expect(serialiseUserColors(colors)).toBe("{}");
  });
});
