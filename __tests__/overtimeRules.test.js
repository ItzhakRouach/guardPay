/* global describe, test, expect */
const {
  DEFAULT_RULES,
  parseOvertimeRules,
  serialiseOvertimeRules,
  toCalcRules,
} = require("../utils/overtimeRules");

describe("parseOvertimeRules", () => {
  test("empty / missing → defaults (weekly off, 8h day, continuous night)", () => {
    expect(parseOvertimeRules(undefined)).toEqual(DEFAULT_RULES);
    expect(parseOvertimeRules(null)).toEqual(DEFAULT_RULES);
    expect(parseOvertimeRules("")).toEqual(DEFAULT_RULES);
  });
  test("invalid JSON / wrong types → defaults", () => {
    expect(parseOvertimeRules("{nope")).toEqual(DEFAULT_RULES);
    expect(parseOvertimeRules("[]")).toEqual(DEFAULT_RULES);
    expect(
      parseOvertimeRules(JSON.stringify({ weekly: "yes", daily: "8.6" })),
    ).toEqual(DEFAULT_RULES);
  });
  test("valid values are honoured; daily accepts only 8 or 8.6", () => {
    expect(
      parseOvertimeRules(
        JSON.stringify({ weekly: true, daily: 8.6, midnightSplit: true }),
      ),
    ).toEqual({ weekly: true, daily: 8.6, midnightSplit: true });
    expect(parseOvertimeRules(JSON.stringify({ daily: 9 })).daily).toBe(8);
    expect(parseOvertimeRules(JSON.stringify({ daily: 7 })).daily).toBe(8);
  });
  test("accepts an already-parsed object and ignores unknown keys", () => {
    expect(parseOvertimeRules({ weekly: true, foo: 1 })).toEqual({
      ...DEFAULT_RULES,
      weekly: true,
    });
  });
});

describe("serialiseOvertimeRules", () => {
  test("defaults serialise to an empty object", () => {
    expect(serialiseOvertimeRules(DEFAULT_RULES)).toBe("{}");
  });
  test("only non-default keys are written; round-trips", () => {
    const rules = { weekly: true, daily: 8, midnightSplit: true };
    const s = serialiseOvertimeRules(rules);
    expect(JSON.parse(s)).toEqual({ weekly: true, midnightSplit: true });
    expect(parseOvertimeRules(s)).toEqual(rules);
  });
});

describe("toCalcRules", () => {
  test("weekly off → weeklyRegularBefore null regardless of the argument", () => {
    expect(toCalcRules(DEFAULT_RULES, 40)).toEqual({
      dailyRegularHours: 8,
      nightRegularHours: 7,
      midnightSplit: false,
      weeklyCap: 42,
      weeklyRegularBefore: null,
    });
  });
  test("weekly on → passes the number through (0 is a valid value)", () => {
    expect(
      toCalcRules({ ...DEFAULT_RULES, weekly: true, daily: 8.6 }, 0),
    ).toMatchObject({ dailyRegularHours: 8.6, weeklyRegularBefore: 0 });
    expect(
      toCalcRules({ ...DEFAULT_RULES, weekly: true }, 37.5).weeklyRegularBefore,
    ).toBe(37.5);
  });
});
