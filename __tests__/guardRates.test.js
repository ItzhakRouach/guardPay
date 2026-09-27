/* global describe, test, expect */
const { GUARD_RATES, currentGuardRates } = require("../utils/guardRates");

describe("currentGuardRates", () => {
  test("inside the 2026 window", () => {
    const r = currentGuardRates(new Date(2026, 8, 27));
    expect(r).toMatchObject({
      regular: 39.11,
      supervisor: 39.16,
      minWage: 35.4,
      expired: false,
    });
  });
  test("before any window → latest known rates, flagged expired", () => {
    expect(currentGuardRates(new Date(2025, 0, 1)).expired).toBe(true);
  });
  test("after the window → latest known rates, flagged expired", () => {
    const r = currentGuardRates(new Date(2027, 1, 1));
    expect(r.expired).toBe(true);
    expect(r.regular).toBe(GUARD_RATES[GUARD_RATES.length - 1].regular);
  });
});
