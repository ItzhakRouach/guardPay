/* global describe, test, expect */
const {
  SWATCHES,
  DARK_MODE_LOOKUP,
  DEFAULT_COLORS,
  parseUserColors,
  resolveTint,
  resolveSwatchHex,
  serialiseUserColors,
} = require("../utils/shiftColors");

describe("SWATCHES palette", () => {
  test("each swatch has a name plus paired light/dark hex values", () => {
    expect(SWATCHES.length).toBe(8);
    for (const s of SWATCHES) {
      expect(typeof s.name).toBe("string");
      expect(s.light).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(s.dark).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(s.light.toUpperCase()).not.toBe(s.dark.toUpperCase());
    }
  });

  test("default colors all resolve to a swatch's light hex", () => {
    const lightPalette = new Set(SWATCHES.map((s) => s.light.toUpperCase()));
    for (const key of Object.keys(DEFAULT_COLORS)) {
      expect(lightPalette.has(DEFAULT_COLORS[key].toUpperCase())).toBe(true);
    }
  });

  test("DARK_MODE_LOOKUP maps every light hex to the paired dark hex", () => {
    for (const s of SWATCHES) {
      expect(DARK_MODE_LOOKUP[s.light.toUpperCase()]).toBe(s.dark);
    }
  });
});

describe("resolveSwatchHex", () => {
  test("returns the input unchanged in light mode", () => {
    expect(resolveSwatchHex("#F0F9FF", "light")).toBe("#F0F9FF");
  });

  test("returns the paired dark hex when scheme is dark", () => {
    const sky = SWATCHES.find((s) => s.name === "sky");
    expect(resolveSwatchHex(sky.light, "dark")).toBe(sky.dark);
  });

  test("falls back to the input hex when off-palette in dark mode", () => {
    expect(resolveSwatchHex("#123456", "dark")).toBe("#123456");
  });

  test("passes through null/undefined", () => {
    expect(resolveSwatchHex(null, "dark")).toBeNull();
    expect(resolveSwatchHex(undefined, "dark")).toBeUndefined();
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
    expect(resolveTint({ start_time: monday }, null, "light")).toBeNull();
  });

  test("Friday weekday returns friday tint (light)", () => {
    expect(resolveTint({ start_time: friday }, null, "light")).toBe(
      DEFAULT_COLORS.friday,
    );
  });

  test("Saturday weekday returns saturday tint (light)", () => {
    expect(resolveTint({ start_time: saturday }, null, "light")).toBe(
      DEFAULT_COLORS.saturday,
    );
  });

  test("dark mode swaps to the dark counterpart", () => {
    const sky = SWATCHES.find((s) => s.name === "sky");
    expect(resolveTint({ start_time: friday }, null, "dark")).toBe(sky.dark);
  });

  test("is_holiday wins over Saturday classification", () => {
    expect(
      resolveTint({ start_time: saturday, is_holiday: true }, null, "light"),
    ).toBe(DEFAULT_COLORS.holiday);
  });

  test("is_training wins over Friday classification", () => {
    expect(
      resolveTint({ start_time: friday, is_training: true }, null, "light"),
    ).toBe(DEFAULT_COLORS.training);
  });

  test("is_holiday wins over is_training", () => {
    expect(
      resolveTint(
        { start_time: friday, is_training: true, is_holiday: true },
        null,
        "light",
      ),
    ).toBe(DEFAULT_COLORS.holiday);
  });

  test("is_sick paints with the sick tint", () => {
    expect(
      resolveTint({ start_time: friday, is_sick: true }, null, "light"),
    ).toBe(DEFAULT_COLORS.sick);
  });

  test("is_sick wins over Saturday classification", () => {
    expect(
      resolveTint({ start_time: saturday, is_sick: true }, null, "light"),
    ).toBe(DEFAULT_COLORS.sick);
  });

  test("is_holiday wins over is_sick", () => {
    expect(
      resolveTint(
        { start_time: friday, is_sick: true, is_holiday: true },
        null,
        "light",
      ),
    ).toBe(DEFAULT_COLORS.holiday);
  });

  test("uses the user's custom color when set", () => {
    const userColors = JSON.stringify({ saturday: "#F7FEE7" }); // sage
    expect(resolveTint({ start_time: saturday }, userColors, "light")).toBe(
      "#F7FEE7",
    );
  });

  test("custom color is swapped to its dark counterpart in dark mode", () => {
    const sage = SWATCHES.find((s) => s.name === "sage");
    const userColors = JSON.stringify({ saturday: sage.light });
    expect(resolveTint({ start_time: saturday }, userColors, "dark")).toBe(
      sage.dark,
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
    const colors = {
      ...DEFAULT_COLORS,
      friday: DEFAULT_COLORS.friday.toLowerCase(),
    };
    expect(serialiseUserColors(colors)).toBe("{}");
  });
});
