/* global describe, test, expect */
const { normalizeDecimal } = require("../utils/decimal");

describe("normalizeDecimal", () => {
  test("returns empty string for null/undefined", () => {
    expect(normalizeDecimal(null)).toBe("");
    expect(normalizeDecimal(undefined)).toBe("");
  });

  test("passes through plain integers", () => {
    expect(normalizeDecimal("50")).toBe("50");
    expect(normalizeDecimal("0")).toBe("0");
  });

  test("passes through plain decimals", () => {
    expect(normalizeDecimal("50.5")).toBe("50.5");
    expect(normalizeDecimal(".5")).toBe(".5");
  });

  test("converts Hebrew/RTL comma to dot (regression: '52,5' was stored as 525)", () => {
    expect(normalizeDecimal("52,5")).toBe("52.5");
    expect(normalizeDecimal("0,75")).toBe("0.75");
  });

  test("strips alphabetic and special characters", () => {
    expect(normalizeDecimal("50abc")).toBe("50");
    expect(normalizeDecimal("$50")).toBe("50");
    expect(normalizeDecimal("50 ₪")).toBe("50");
  });

  test("collapses extra dots so '50..5' -> '50.5'", () => {
    expect(normalizeDecimal("50..5")).toBe("50.5");
    expect(normalizeDecimal("50.5.5")).toBe("50.55");
    expect(normalizeDecimal("1.2.3.4")).toBe("1.234");
  });

  test("handles mixed commas and dots", () => {
    expect(normalizeDecimal("50,5.5")).toBe("50.55");
    expect(normalizeDecimal("1,2,3")).toBe("1.23");
  });

  test("accepts numeric input as well as string", () => {
    expect(normalizeDecimal(50.5)).toBe("50.5");
    expect(normalizeDecimal(0)).toBe("0");
  });

  test("returned value parses to the expected Number", () => {
    expect(Number(normalizeDecimal("52,5"))).toBe(52.5);
    expect(Number(normalizeDecimal("50..5"))).toBe(50.5);
  });
});
