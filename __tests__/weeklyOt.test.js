/* global describe, test, expect */
const {
  calculateShiftPay,
  computeShiftDoc,
  DEFAULT_CALC_RULES,
} = require("../utils/salaryLogic");

const RATE = 40;
const shift = (start, end, rules, holiday = false) =>
  calculateShiftPay(start, end, RATE, 0, holiday, rules);
const weekly = (before, extra = {}) => ({
  ...DEFAULT_CALC_RULES,
  weeklyRegularBefore: before,
  ...extra,
});

// --- Backward compatibility: the gate for shipping ---------------------
describe("calculateShiftPay — rules omitted is byte-identical to explicit defaults", () => {
  const fixtures = [
    ["2026-04-06T07:00:00", "2026-04-06T15:00:00", false], // weekday 8h
    ["2026-04-06T07:00:00", "2026-04-06T19:00:00", false], // weekday 12h
    ["2026-04-06T22:00:00", "2026-04-07T06:00:00", false], // night 8h
    ["2026-04-06T22:00:00", "2026-04-06T06:00:00", false], // legacy end<start
    ["2026-04-10T14:00:00", "2026-04-10T23:00:00", false], // Friday into weekend
    ["2026-04-11T07:00:00", "2026-04-11T19:00:00", false], // Saturday 12h
    ["2026-04-11T20:00:00", "2026-04-12T08:00:00", false], // Sat night across Sunday 04:00 cutoff
    ["2026-04-06T07:00:00", "2026-04-06T19:00:00", true], // holiday 12h
  ];
  test.each(fixtures)("%s → %s (holiday=%s)", (s, e, h) => {
    const a = calculateShiftPay(s, e, RATE, 22.6, h);
    const b = calculateShiftPay(s, e, RATE, 22.6, h, { ...DEFAULT_CALC_RULES });
    const c = calculateShiftPay(s, e, RATE, 22.6, h, undefined);
    expect(b).toEqual(a);
    expect(c).toEqual(a);
  });
});

// --- Weekly rule ------------------------------------------------------
describe("calculateShiftPay — weekly cap (42 h of regular hours)", () => {
  test("40 h already used: 8 h shift → 2 h regular, then 2 h @125, 4 h @150", () => {
    const r = shift("2026-04-10T07:00:00", "2026-04-10T15:00:00", weekly(40));
    expect(r.h100_hours).toBe(2);
    expect(r.h125_extra_hours).toBe(2);
    expect(r.h150_extra_hours).toBe(4);
    expect(r.reg_hours).toBe(2);
    expect(r.extra_hours).toBe(6);
    expect(r.reg_pay_amount).toBe(80);
    expect(r.extra_pay_amount).toBe(2 * 50 + 4 * 60);
    expect(r.total_amount).toBe(80 + 100 + 240);
  });
  test("daily and weekly merge: 40 h used, 10 h shift → 2 regular + 8 OT (2@125, 6@150)", () => {
    const r = shift("2026-04-06T07:00:00", "2026-04-06T17:00:00", weekly(40));
    expect(r.h100_hours).toBe(2);
    expect(r.h125_extra_hours).toBe(2);
    expect(r.h150_extra_hours).toBe(6);
  });
  test("under the cap the weekly rule changes nothing", () => {
    const a = shift("2026-04-06T07:00:00", "2026-04-06T17:00:00");
    const b = shift("2026-04-06T07:00:00", "2026-04-06T17:00:00", weekly(24));
    expect(b).toEqual(a);
  });
  test("weeklyRegularBefore 0 (first shift of the week) equals no weekly rule for a normal day", () => {
    const a = shift("2026-04-06T07:00:00", "2026-04-06T15:00:00");
    const b = shift("2026-04-06T07:00:00", "2026-04-06T15:00:00", weekly(0));
    expect(b).toEqual(a);
  });
  test("fractional weekly remainder: 41.6 h used → 0.4 h regular then OT, exact", () => {
    const r = shift("2026-04-06T07:00:00", "2026-04-06T15:00:00", weekly(41.6));
    expect(r.h100_hours).toBeCloseTo(0.4, 6);
    expect(r.h125_extra_hours).toBeCloseTo(2, 6);
    expect(r.h150_extra_hours).toBeCloseTo(5.6, 6);
    expect(r.reg_hours + r.extra_hours).toBeCloseTo(8, 6);
  });
  test("cap already exhausted: whole shift is OT, tiered 2 then rest", () => {
    const r = shift("2026-04-06T07:00:00", "2026-04-06T15:00:00", weekly(42));
    expect(r.h100_hours).toBe(0);
    expect(r.h125_extra_hours).toBe(2);
    expect(r.h150_extra_hours).toBe(6);
  });
  test("Shabbat shift past the cap pays 175/200 (150 inside the regular portion)", () => {
    const r = shift("2026-04-11T07:00:00", "2026-04-11T15:00:00", weekly(41));
    expect(r.h150_shabat).toBe(1);
    expect(r.h175_extra_hours).toBe(2);
    expect(r.h200_extra_hours).toBe(5);
  });
  test("holiday shift past the cap lands in the *_holiday buckets", () => {
    const r = shift(
      "2026-04-06T07:00:00",
      "2026-04-06T15:00:00",
      weekly(41),
      true,
    );
    expect(r.h150_holiday).toBe(1);
    expect(r.h175_holiday).toBe(2);
    expect(r.h200_holiday).toBe(5);
    expect(r.h150_shabat + r.h175_extra_hours + r.h200_extra_hours).toBe(0);
  });
  test("night shift: 7 h daily cap still applies alongside the weekly cap", () => {
    const r = shift("2026-04-06T22:00:00", "2026-04-07T06:00:00", weekly(38));
    expect(r.h100_hours).toBe(4);
    expect(r.h125_extra_hours).toBe(2);
    expect(r.h150_extra_hours).toBe(2);
  });
});

// --- Daily norm 8.6 ---------------------------------------------------
describe("calculateShiftPay — daily norm 8.6", () => {
  const d86 = (before = null) => ({
    ...DEFAULT_CALC_RULES,
    dailyRegularHours: 8.6,
    weeklyRegularBefore: before,
  });
  test("9 h shift → 8.6 regular, 0.4 OT @125", () => {
    const r = shift("2026-04-06T07:00:00", "2026-04-06T16:00:00", d86());
    expect(r.h100_hours).toBeCloseTo(8.6, 6);
    expect(r.h125_extra_hours).toBeCloseTo(0.4, 6);
    expect(r.reg_hours).toBeCloseTo(8.6, 6);
  });
  test("8 h shift → all regular", () => {
    const r = shift("2026-04-06T07:00:00", "2026-04-06T15:00:00", d86());
    expect(r.h100_hours).toBe(8);
    expect(r.extra_hours).toBe(0);
  });
  test("11 h shift → 8.6 + 2 @125 + 0.4 @150", () => {
    const r = shift("2026-04-06T07:00:00", "2026-04-06T18:00:00", d86());
    expect(r.h125_extra_hours).toBeCloseTo(2, 6);
    expect(r.h150_extra_hours).toBeCloseTo(0.4, 6);
  });
  test("night shift ignores the 8.6 norm (7 h cap)", () => {
    const r = shift("2026-04-06T22:00:00", "2026-04-07T07:00:00", d86());
    expect(r.h100_hours).toBe(7);
  });
});

// --- Midnight split ---------------------------------------------------
describe("calculateShiftPay — midnight split", () => {
  const split = { ...DEFAULT_CALC_RULES, midnightSplit: true };
  test("20:00–06:00 continuous (default): 7 regular (night) + 2@125 + 1@150", () => {
    const r = shift("2026-04-06T20:00:00", "2026-04-07T06:00:00");
    expect(r.h100_hours).toBe(7);
    expect(r.h125_extra_hours).toBe(2);
    expect(r.h150_extra_hours).toBe(1);
  });
  test("20:00–06:00 split: two work days of 4 h + 6 h, each under the 7 h night cap → all regular", () => {
    const r = shift("2026-04-06T20:00:00", "2026-04-07T06:00:00", split);
    expect(r.h100_hours).toBe(10);
    expect(r.extra_hours).toBe(0);
  });
  test("split resets the OT tier at midnight: 12:00–04:00 (night, cap 7) → 7+2@125+3@150 before midnight, 4 regular after", () => {
    const r = shift("2026-04-06T12:00:00", "2026-04-07T04:00:00", split);
    expect(r.h100_hours).toBe(11);
    expect(r.h125_extra_hours).toBe(2);
    expect(r.h150_extra_hours).toBe(3);
  });
  test("split + weekly: the weekly total keeps running across midnight", () => {
    const r = shift("2026-04-06T20:00:00", "2026-04-07T06:00:00", {
      ...split,
      weeklyRegularBefore: 36,
    });
    expect(r.h100_hours).toBe(6);
    expect(r.h125_extra_hours).toBe(2);
    expect(r.h150_extra_hours).toBe(2);
  });
});

describe("computeShiftDoc — rules and weekly_regular_before", () => {
  const base = {
    startTime: "2026-04-10T07:00:00",
    endTime: "2026-04-10T15:00:00",
    baseRate: RATE,
    travelRate: 0,
    type: "morning",
    isHoliday: false,
  };
  test("no rules → no weekly_regular_before key, numbers as before", () => {
    const doc = computeShiftDoc(base);
    expect("weekly_regular_before" in doc).toBe(false);
    expect(doc.h100_hours).toBe(8);
  });
  test("weekly rules → field recorded and brackets shift", () => {
    const doc = computeShiftDoc({ ...base, rules: weekly(40) });
    expect(doc.weekly_regular_before).toBe(40);
    expect(doc.h100_hours).toBe(2);
    expect(doc.h125_extra_hours).toBe(2);
  });
  test("weekly off (null) → key absent even with rules object", () => {
    const doc = computeShiftDoc({ ...base, rules: { ...DEFAULT_CALC_RULES } });
    expect("weekly_regular_before" in doc).toBe(false);
  });
  test("training days ignore rules and never carry the field", () => {
    const doc = computeShiftDoc({
      ...base,
      type: "training",
      rules: weekly(40),
    });
    expect(doc.is_training).toBe(true);
    expect("weekly_regular_before" in doc).toBe(false);
    expect(doc.total_amount).toBe(RATE * 8);
  });
});

const {
  weekStartOf,
  weekEndOf,
  weekKeyOf,
  regularHoursBefore,
  recomputeWeek,
} = require("../utils/weeklyOt");
const { DEFAULT_RULES } = require("../utils/overtimeRules");

const doc = (id, start, end, extra = {}) => ({
  $id: id,
  ...computeShiftDoc({
    startTime: start,
    endTime: end,
    baseRate: RATE,
    travelRate: 0,
    type: "morning",
    isHoliday: false,
  }),
  ...extra,
});
const WEEKLY = { ...DEFAULT_RULES, weekly: true };

describe("week boundaries", () => {
  test("weekStartOf is the local Sunday 00:00; weekEndOf the next Sunday", () => {
    const wed = new Date(2026, 3, 8, 13); // Wed 8 Apr 2026
    expect(weekStartOf(wed).getTime()).toBe(new Date(2026, 3, 5).getTime());
    expect(weekEndOf(wed).getTime()).toBe(new Date(2026, 3, 12).getTime());
    expect(weekKeyOf(wed)).toBe("2026-3-5");
  });
  test("a Saturday-night shift belongs to the week it starts in", () => {
    expect(weekKeyOf("2026-04-11T23:00:00")).toBe("2026-3-5");
    expect(weekKeyOf("2026-04-12T00:30:00")).toBe("2026-3-12");
  });
});

describe("regularHoursBefore", () => {
  const week = [
    doc("a", "2026-04-05T07:00:00", "2026-04-05T15:00:00"), // Sun 8h → 8 reg
    doc("b", "2026-04-06T07:00:00", "2026-04-06T17:00:00"), // Mon 10h → 8 reg
    doc("c", "2026-04-07T07:00:00", "2026-04-07T15:00:00", {
      is_training: true,
    }), // ignored
    doc("d", "2026-04-08T07:00:00", "2026-04-08T15:00:00"), // Wed 8h
  ];
  test("sums reg_hours of earlier worked docs only", () => {
    expect(regularHoursBefore(week, "2026-04-08T07:00:00")).toBe(16);
    expect(regularHoursBefore(week, "2026-04-09T07:00:00")).toBe(24);
    expect(regularHoursBefore(week, "2026-04-05T06:00:00")).toBe(0);
  });
  test("excludes the document being edited", () => {
    expect(regularHoursBefore(week, "2026-04-09T07:00:00", "d")).toBe(16);
  });
});

describe("recomputeWeek", () => {
  const sixDays = [
    doc("sun", "2026-04-05T07:00:00", "2026-04-05T15:00:00"),
    doc("mon", "2026-04-06T07:00:00", "2026-04-06T15:00:00"),
    doc("tue", "2026-04-07T07:00:00", "2026-04-07T15:00:00"),
    doc("wed", "2026-04-08T07:00:00", "2026-04-08T15:00:00"),
    doc("thu", "2026-04-09T07:00:00", "2026-04-09T15:00:00"),
    doc("fri", "2026-04-10T07:00:00", "2026-04-10T15:00:00"),
  ];
  test("weekly on: only Friday's numbers change (2 reg, 2@125, 4@150); earlier days get the field", () => {
    const updates = recomputeWeek(sixDays, WEEKLY);
    const byId = Object.fromEntries(updates.map((u) => [u.$id, u]));
    expect(byId.fri.h100_hours).toBe(2);
    expect(byId.fri.h125_extra_hours).toBe(2);
    expect(byId.fri.h150_extra_hours).toBe(4);
    expect(byId.fri.weekly_regular_before).toBe(40);
    expect(byId.sun.weekly_regular_before).toBe(0);
    expect(byId.sun.h100_hours).toBe(8);
    expect(updates).toHaveLength(6);
  });
  test("stable: recomputing already-recomputed docs yields no updates", () => {
    const first = recomputeWeek(sixDays, WEEKLY);
    const applied = sixDays.map((d) => ({
      ...d,
      ...(first.find((u) => u.$id === d.$id) || {}),
    }));
    expect(recomputeWeek(applied, WEEKLY)).toEqual([]);
  });
  test("weekly off restores daily-only numbers and clears the field", () => {
    const first = recomputeWeek(sixDays, WEEKLY);
    const applied = sixDays.map((d) => ({
      ...d,
      ...(first.find((u) => u.$id === d.$id) || {}),
    }));
    const back = recomputeWeek(applied, DEFAULT_RULES);
    const fri = back.find((u) => u.$id === "fri");
    expect(fri.h100_hours).toBe(8);
    expect(fri.extra_hours).toBe(0);
    expect(fri.weekly_regular_before).toBeNull();
    expect(recomputeWeek(sixDays, DEFAULT_RULES)).toEqual([]);
  });
  test("order is by start time regardless of input order", () => {
    const shuffled = [
      sixDays[5],
      sixDays[2],
      sixDays[0],
      sixDays[4],
      sixDays[1],
      sixDays[3],
    ];
    const updates = recomputeWeek(shuffled, WEEKLY);
    expect(updates.find((u) => u.$id === "fri").weekly_regular_before).toBe(40);
    expect(updates.find((u) => u.$id === "sun").weekly_regular_before).toBe(0);
  });
  test("flat-day docs are ignored and contribute nothing", () => {
    const withFlat = [
      ...sixDays,
      doc("sick", "2026-04-09T00:00:00", "2026-04-09T23:59:00", {
        is_sick: true,
        reg_hours: 8,
      }),
    ];
    const updates = recomputeWeek(withFlat, WEEKLY);
    expect(updates.find((u) => u.$id === "sick")).toBeUndefined();
    expect(updates.find((u) => u.$id === "fri").weekly_regular_before).toBe(40);
  });
  test("legacy end<start document recomputes to its own stored numbers (no spurious update)", () => {
    const legacy = {
      ...doc("n", "2026-04-06T22:00:00", "2026-04-07T06:00:00"),
      end_time: "2026-04-06T06:00:00",
    };
    expect(recomputeWeek([legacy], DEFAULT_RULES)).toEqual([]);
  });
  test("missing base_rate: skipped for rewriting but its reg_hours still advance the week", () => {
    const old = {
      ...doc("old", "2026-04-05T07:00:00", "2026-04-05T15:00:00"),
      base_rate: undefined,
    };
    const fri = doc("fri", "2026-04-10T07:00:00", "2026-04-10T15:00:00");
    const updates = recomputeWeek([old, fri], WEEKLY);
    expect(updates.find((u) => u.$id === "old")).toBeUndefined();
    expect(updates.find((u) => u.$id === "fri").weekly_regular_before).toBe(8);
  });
  test("8.6 daily norm flows through the rules", () => {
    const nine = doc("nine", "2026-04-06T07:00:00", "2026-04-06T16:00:00");
    const [u] = recomputeWeek([nine], { ...DEFAULT_RULES, daily: 8.6 });
    expect(u.h100_hours).toBeCloseTo(8.6, 6);
    expect(u.weekly_regular_before).toBeNull();
  });
});

// --- Byte-identity fuzz against the pre-rules golden reference -----------
const {
  legacyCalculateShiftPay,
} = require("./fixtures/legacyCalculateShiftPay");

describe("calculateShiftPay — defaults equal the golden reference on random shifts", () => {
  // Deterministic LCG so a failure is reproducible.
  let seed = 20260927;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const cases = [];
  for (let i = 0; i < 3000; i += 1) {
    const day = 1 + Math.floor(rnd() * 28);
    const hour = Math.floor(rnd() * 24);
    const minute = Math.floor(rnd() * 60); // deliberately NOT 15-min aligned
    const durationMin = 60 + Math.floor(rnd() * (14 * 60)); // 1h .. 15h
    const start = new Date(2026, 3, day, hour, minute);
    const end = new Date(start.getTime() + durationMin * 60000);
    const holiday = rnd() < 0.15;
    const rate = [35.4, 39.11, 40, 52.5][Math.floor(rnd() * 4)];
    const travel = rnd() < 0.5 ? 22.6 : 0;
    cases.push([start.toISOString(), end.toISOString(), rate, travel, holiday]);
  }
  test("3000 random shifts (unaligned starts, Sunday-cutoff crossings, holidays)", () => {
    const diffs = [];
    for (const [s, e, rate, travel, h] of cases) {
      const a = legacyCalculateShiftPay(s, e, rate, travel, h);
      const b = calculateShiftPay(s, e, rate, travel, h);
      if (JSON.stringify(a) !== JSON.stringify(b)) diffs.push({ s, e, a, b });
    }
    expect(diffs.slice(0, 3)).toEqual([]);
    expect(diffs).toHaveLength(0);
  });
  test("explicit: unaligned Saturday-night start crossing Sunday 04:00", () => {
    const s = "2026-04-25T22:37:00";
    const e = "2026-04-26T09:25:00";
    expect(calculateShiftPay(s, e, 40, 0, false)).toEqual(
      legacyCalculateShiftPay(s, e, 40, 0, false),
    );
  });
});

describe("recomputeWeek — hygiene", () => {
  test("a doc with an unparseable date is skipped, never zeroed, and still advances the week", () => {
    const broken = {
      ...doc("bad", "2026-04-05T07:00:00", "2026-04-05T15:00:00"),
      start_time: "not a date",
    };
    const fri = doc("fri", "2026-04-10T07:00:00", "2026-04-10T15:00:00");
    const updates = recomputeWeek([broken, fri], WEEKLY);
    expect(updates.find((u) => u.$id === "bad")).toBeUndefined();
    expect(updates.find((u) => u.$id === "fri").weekly_regular_before).toBe(8);
  });
  test("weekly_regular_before is stored rounded to 2 decimals", () => {
    const a = doc("a", "2026-04-05T07:00:00", "2026-04-05T15:36:00"); // 8.6 h
    const b = doc("b", "2026-04-06T07:00:00", "2026-04-06T15:36:00");
    const c = doc("c", "2026-04-07T07:00:00", "2026-04-07T15:36:00");
    const d4 = doc("d", "2026-04-08T07:00:00", "2026-04-08T15:00:00");
    const updates = recomputeWeek([a, b, c, d4], { ...WEEKLY, daily: 8.6 });
    const before = updates.find((u) => u.$id === "d").weekly_regular_before;
    expect(before).toBe(25.8);
    expect(String(before)).toBe("25.8");
  });
});

describe("calculateShiftPay — daily and weekly boundary coincide", () => {
  test("34 h used + 8 h shift: the cap and the 42 land together → identical to no rules", () => {
    const a = shift("2026-04-06T07:00:00", "2026-04-06T15:00:00");
    const b = shift("2026-04-06T07:00:00", "2026-04-06T15:00:00", weekly(34));
    expect(b).toEqual(a);
  });
  test("34 h used + 10 h shift: the 9th and 10th hours are OT under both rules, still 2@125", () => {
    const r = shift("2026-04-06T07:00:00", "2026-04-06T17:00:00", weekly(34));
    expect(r.h100_hours).toBe(8);
    expect(r.h125_extra_hours).toBe(2);
    expect(r.h150_extra_hours).toBe(0);
  });
});
