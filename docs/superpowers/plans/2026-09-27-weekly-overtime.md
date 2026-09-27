# Weekly Overtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add opt-in weekly (42 h) overtime, a configurable daily norm (8 / 8.6), optional midnight split, guard-sector rate presets and Overview compliance flags — with zero change for users who don't opt in.

**Architecture:** The per-shift calculator gains an optional `rules` argument (pure, CommonJS, test-locked to be byte-identical with defaults). Week context is injected at write time: Add Shift fetches the week, computes the shift with "regular hours already used", saves it, then recomputes later shifts in that week through a pure `recomputeWeek` that returns minimal diffs (the sick-day restreak pattern). Rules live as JSON in `users_prefs.overtime_rules`; changing them recomputes the current month.

**Tech Stack:** Expo SDK 54 / React Native 0.81, react-native-appwrite 0.19, react-native-paper, Jest 29 (node env, CJS utils + ESM re-exports in `lib/`).

**Spec:** `docs/superpowers/specs/2026-09-27-weekly-overtime-design.md`

## Global Constraints

- Production app; never rename/delete a field on `shifts_history` or `users_prefs`; new fields optional only (spec §4.2, §4.8).
- Weekly cap is fixed at **42**; night norm fixed at **7**; daily norm is **8 or 8.6** only (spec §2).
- With `rules` omitted, `calculateShiftPay` must reproduce all 51 existing salary assertions **byte-for-byte** (spec §4.1).
- Only `reg_hours` of **worked** docs (not training/vacation/sick) count toward 42 (spec §2).
- OT tiering is per shift/day: first 2 OT h 125% (175% weekend/holiday), rest 150% (200%) (spec §2).
- A shift belongs to the week (Sun 00:00 → Sat 24:00, local) it **starts** in (spec §2).
- Rule changes recompute **the current month only** (spec §2, §4.3).
- Pure logic in `utils/*.js` (CommonJS) with ESM re-export in `lib/*.js`; app code imports `lib/` (CLAUDE.md conventions).
- Every new UI string exists in `he`, `en`, `ar` in `translations/vocabulary.js`.
- `npm test` green and `salary-logic-guardian` PASS before merge; `lib/salaryCache.js` key bumped to `v2` (spec §4.8).
- Owner adds two console attributes before merge: `users_prefs.overtime_rules` (String 1024, optional), `shifts_history.weekly_regular_before` (Float, optional, 0–200) (spec §7).

## Review Focus

1. **A legacy overnight document (`end_time` < `start_time`) inside a week being recomputed** — must be treated as next-day, same as the calculator always did, and produce identical numbers to its stored ones so it yields no spurious update. → Task 4 test "legacy end<start".
2. **A document with no `base_rate`** (very old) in a recomputed week — must be skipped for rewriting but its `reg_hours` must still advance the running weekly total. → Task 4 test "missing base_rate".
3. **Weekly remainder that is not a multiple of 0.25 h** (e.g. 41.6 h already used) — the next block must split into 0.4 h regular / 0.15 h OT... i.e. exact fractions, no whole-block rounding. → Task 2 test "fractional weekly remainder".
4. **8.6 daily norm on a shift shorter than 8.6 h** — must be all regular, no OT, and `reg_hours` equals the duration. → Task 2 test "8.6 norm, 8 h shift".
5. **Toggle OFF after ON** — recompute must strip the weekly effect (numbers back to daily-only) and clear `weekly_regular_before` on affected docs, and must yield **no updates** for docs never computed under the weekly rule. → Task 4 tests "weekly off restores" and "stable on second run".

---

### Task 1: Overtime rules — parse / serialise

**Files:**
- Create: `utils/overtimeRules.js`
- Create: `lib/overtimeRules.js`
- Test: `__tests__/overtimeRules.test.js`

**Interfaces:**
- Produces: `DEFAULT_RULES = { weekly:false, daily:8, midnightSplit:false }`; `parseOvertimeRules(raw) → {weekly, daily, midnightSplit}` (always complete); `serialiseOvertimeRules(rules) → string` (non-defaults only); `toCalcRules(rules, weeklyRegularBefore) → { dailyRegularHours, nightRegularHours:7, midnightSplit, weeklyCap:42, weeklyRegularBefore }` where `weeklyRegularBefore` is `null` when `rules.weekly` is false.

- [ ] **Step 1: Write the failing test**

```js
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
    expect(parseOvertimeRules(JSON.stringify({ weekly: "yes", daily: "8.6" }))).toEqual(DEFAULT_RULES);
  });
  test("valid values are honoured; daily accepts only 8 or 8.6", () => {
    expect(parseOvertimeRules(JSON.stringify({ weekly: true, daily: 8.6, midnightSplit: true }))).toEqual({
      weekly: true,
      daily: 8.6,
      midnightSplit: true,
    });
    expect(parseOvertimeRules(JSON.stringify({ daily: 9 })).daily).toBe(8);
    expect(parseOvertimeRules(JSON.stringify({ daily: 7 })).daily).toBe(8);
  });
  test("accepts an already-parsed object and ignores unknown keys", () => {
    expect(parseOvertimeRules({ weekly: true, foo: 1 })).toEqual({ ...DEFAULT_RULES, weekly: true });
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
    expect(toCalcRules({ ...DEFAULT_RULES, weekly: true, daily: 8.6 }, 0)).toMatchObject({
      dailyRegularHours: 8.6,
      weeklyRegularBefore: 0,
    });
    expect(toCalcRules({ ...DEFAULT_RULES, weekly: true }, 37.5).weeklyRegularBefore).toBe(37.5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/overtimeRules.test.js`
Expected: FAIL — `Cannot find module '../utils/overtimeRules'`

- [ ] **Step 3: Write the implementation**

`utils/overtimeRules.js`:

```js
// Per-user overtime rules, stored as JSON in users_prefs.overtime_rules.
// Same conventions as utils/shiftTimes.js: defensive parse that always
// returns a complete object, and a serialiser that writes only the keys
// that differ from the defaults.
//
// Fixed by law (not user-editable): weekly cap 42 h, night norm 7 h.
// User choices: weekly rule on/off, daily norm 8 or 8.6, overnight shift
// continuous or split at midnight.

const WEEKLY_CAP = 42;
const NIGHT_REGULAR_HOURS = 7;
const DAILY_CHOICES = [8, 8.6];

const DEFAULT_RULES = Object.freeze({
  weekly: false,
  daily: 8,
  midnightSplit: false,
});

const parseOvertimeRules = (raw) => {
  if (raw === undefined || raw === null || raw === "") return { ...DEFAULT_RULES };
  let parsed;
  try {
    parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return { ...DEFAULT_RULES };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ...DEFAULT_RULES };
  }
  const out = { ...DEFAULT_RULES };
  if (typeof parsed.weekly === "boolean") out.weekly = parsed.weekly;
  if (DAILY_CHOICES.includes(parsed.daily)) out.daily = parsed.daily;
  if (typeof parsed.midnightSplit === "boolean") out.midnightSplit = parsed.midnightSplit;
  return out;
};

const serialiseOvertimeRules = (rules) => {
  const r = parseOvertimeRules(rules);
  const diff = {};
  for (const k of Object.keys(DEFAULT_RULES)) {
    if (r[k] !== DEFAULT_RULES[k]) diff[k] = r[k];
  }
  return JSON.stringify(diff);
};

// The shape calculateShiftPay consumes. `weeklyRegularBefore` = regular-rate
// hours already used this week before the shift; null switches the weekly
// rule off inside the calculator.
const toCalcRules = (rules, weeklyRegularBefore) => {
  const r = parseOvertimeRules(rules);
  const before =
    r.weekly && Number.isFinite(Number(weeklyRegularBefore))
      ? Number(weeklyRegularBefore)
      : null;
  return {
    dailyRegularHours: r.daily,
    nightRegularHours: NIGHT_REGULAR_HOURS,
    midnightSplit: r.midnightSplit,
    weeklyCap: WEEKLY_CAP,
    weeklyRegularBefore: before,
  };
};

module.exports = {
  DEFAULT_RULES,
  DAILY_CHOICES,
  WEEKLY_CAP,
  NIGHT_REGULAR_HOURS,
  parseOvertimeRules,
  serialiseOvertimeRules,
  toCalcRules,
};
```

`lib/overtimeRules.js`:

```js
export {
  DAILY_CHOICES,
  DEFAULT_RULES,
  NIGHT_REGULAR_HOURS,
  WEEKLY_CAP,
  parseOvertimeRules,
  serialiseOvertimeRules,
  toCalcRules,
} from "../utils/overtimeRules";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/overtimeRules.test.js`
Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
git add utils/overtimeRules.js lib/overtimeRules.js __tests__/overtimeRules.test.js
git commit -m "feat(ot): overtime rules parse/serialise with law-fixed constants"
```

---

### Task 2: `calculateShiftPay` gains an optional `rules` argument

**Files:**
- Modify: `utils/salaryLogic.js` (function `calculateShiftPay`, currently lines 85–235)
- Test: `__tests__/weeklyOt.test.js` (new; calculator section)

**Interfaces:**
- Consumes: nothing new (rules object shape from Task 1 `toCalcRules`, but this function must not import it — it takes a plain object).
- Produces: `calculateShiftPay(startTime, endTime, baseRate, travelRate, isHoliday, rules?)`; same 15-field return. `rules` keys: `dailyRegularHours` (8), `nightRegularHours` (7), `midnightSplit` (false), `weeklyCap` (42), `weeklyRegularBefore` (null). Exported constant `DEFAULT_CALC_RULES`.

- [ ] **Step 1: Write the failing tests**

`__tests__/weeklyOt.test.js` (calculator part; Task 4 appends more `describe`s to this file):

```js
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
    const r = shift("2026-04-06T07:00:00", "2026-04-06T15:00:00", weekly(41), true);
    expect(r.h150_holiday).toBe(1);
    expect(r.h175_holiday).toBe(2);
    expect(r.h200_holiday).toBe(5);
    expect(r.h150_shabat + r.h175_extra_hours + r.h200_extra_hours).toBe(0);
  });
  test("night shift: 7 h daily cap still applies alongside the weekly cap", () => {
    const r = shift("2026-04-06T22:00:00", "2026-04-07T06:00:00", weekly(38));
    // 4 h of weekly room left, but daily cap 7 → regular = min(7, 4) = 4
    expect(r.h100_hours).toBe(4);
    expect(r.h125_extra_hours).toBe(2);
    expect(r.h150_extra_hours).toBe(2);
  });
});

// --- Daily norm 8.6 ---------------------------------------------------
describe("calculateShiftPay — daily norm 8.6", () => {
  const d86 = (before = null) => ({ ...DEFAULT_CALC_RULES, dailyRegularHours: 8.6, weeklyRegularBefore: before });
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
  test("split resets the OT tier at midnight: 12:00–04:00 → 8 reg + 2@125 + 2@150 before midnight, 4 reg after", () => {
    const r = shift("2026-04-06T12:00:00", "2026-04-07T04:00:00", split);
    // Not a night shift (only 2h in window? 22–24 + 0–4 = 6h → it IS night → cap 7)
    // 12:00–24:00 = 12h: 7 regular, 2 @125, 3 @150 ; 00:00–04:00 = 4h regular (new day)
    expect(r.h100_hours).toBe(11);
    expect(r.h125_extra_hours).toBe(2);
    expect(r.h150_extra_hours).toBe(3);
  });
  test("split + weekly: the weekly total keeps running across midnight", () => {
    const r = shift("2026-04-06T20:00:00", "2026-04-07T06:00:00", { ...split, weeklyRegularBefore: 36 });
    // 6 h of weekly room: 4 h before midnight regular, 2 h after midnight regular, then 4 h OT (2@125, 2@150)
    expect(r.h100_hours).toBe(6);
    expect(r.h125_extra_hours).toBe(2);
    expect(r.h150_extra_hours).toBe(2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/weeklyOt.test.js`
Expected: FAIL — `DEFAULT_CALC_RULES` undefined and weekly cases mismatch.

- [ ] **Step 3: Implement**

In `utils/salaryLogic.js`, replace the whole `calculateShiftPay` function (from `// --- Single-shift pay` down to its closing `};`) with:

```js
// --- Single-shift pay (mirrors CALCULATE_SHIFT's calculateShiftPay) ---
//
// `rules` is optional. With it omitted (or equal to DEFAULT_CALC_RULES) the
// output is byte-identical to the historical function — test-locked in
// __tests__/weeklyOt.test.js. With rules:
//   dailyRegularHours   8 | 8.6   regular cap for a day shift
//   nightRegularHours   7         regular cap when ≥2h fall in 22:00–06:00
//   midnightSplit       bool      treat 00:00 as the start of a new work day
//   weeklyCap           42
//   weeklyRegularBefore number|null  regular-rate hours already used this
//                                    week before this shift; null = weekly
//                                    rule OFF
// Per 15-minute block the regular portion is min(block, daily room, weekly
// room); the rest is overtime tiered per day (first 2h 125/175, then
// 150/200). Portions are fractional so 8.6 and odd weekly remainders are
// exact. With defaults every portion is 0 or 0.25 and the tier boundary sits
// at cap+2h — exactly the old arithmetic.
const DEFAULT_CALC_RULES = Object.freeze({
  dailyRegularHours: 8,
  nightRegularHours: 7,
  midnightSplit: false,
  weeklyCap: 42,
  weeklyRegularBefore: null,
});

const calculateShiftPay = (
  startTime,
  endTime,
  baseRate,
  travelRate,
  isHoliday,
  rules,
) => {
  const R = { ...DEFAULT_CALC_RULES, ...(rules || {}) };
  const weeklyOn =
    R.weeklyRegularBefore !== null &&
    R.weeklyRegularBefore !== undefined &&
    Number.isFinite(Number(R.weeklyRegularBefore));

  const start = new Date(startTime);
  let end = new Date(endTime);
  if (end < start) end.setDate(end.getDate() + 1);
  const base = Number(baseRate);

  // Night shift = ≥2h in the 22:00–06:00 window → regular cap drops to 7.
  const checkNightShift = () => {
    let nightHours = 0;
    let current = new Date(start);
    while (current < end) {
      if (current.getHours() >= 22 || current.getHours() < 6)
        nightHours += 0.25;
      current.setMinutes(current.getMinutes() + 15);
    }
    return nightHours >= 2;
  };
  const regLimit = checkNightShift()
    ? Number(R.nightRegularHours)
    : Number(R.dailyRegularHours);

  // Hours from shift start to the first local midnight inside the shift
  // (Infinity when not splitting or when the shift doesn't cross midnight).
  const firstMidnight = new Date(start);
  firstMidnight.setHours(24, 0, 0, 0);
  const midnightOffset =
    R.midnightSplit && firstMidnight < end
      ? (firstMidnight - start) / 3600000
      : Infinity;

  // Running state shared by both Sunday-04:00 segments (same shift/day).
  let regularSoFar = weeklyOn ? Number(R.weeklyRegularBefore) : 0;
  let otSoFarDay = 0;
  let dayRolled = false;

  const calculateHours = (segStart, segEnd, forceWeekday = false) => {
    let rPay = 0,
      ePay = 0,
      rHours = 0,
      eHours = 0;
    let h100 = 0,
      h125e = 0,
      h150e = 0,
      h150s = 0,
      h175s = 0,
      h200s = 0;

    const duration = (segEnd - segStart) / 3600000;
    const globalOffset = (segStart - start) / 3600000;

    for (let i = 0; i < duration; i += 0.25) {
      const currentH = globalOffset + i;
      const blockTime = new Date(segStart.getTime() + i * 3600000);

      const isWeekendOrHoliday =
        !forceWeekday &&
        (isHoliday ||
          (blockTime.getDay() === 5 && blockTime.getHours() >= 16) ||
          blockTime.getDay() === 6 ||
          (blockTime.getDay() === 0 && blockTime.getHours() < 4));

      // Midnight split: hours-into-day and the OT tier restart at 00:00.
      let hoursIntoDay = currentH;
      if (currentH >= midnightOffset) {
        hoursIntoDay = currentH - midnightOffset;
        if (!dayRolled) {
          dayRolled = true;
          otSoFarDay = 0;
        }
      }

      const regularRoom = Math.max(0, regLimit - hoursIntoDay);
      const weeklyRoom = weeklyOn
        ? Math.max(0, Number(R.weeklyCap) - regularSoFar)
        : Infinity;
      const r = Math.min(0.25, regularRoom, weeklyRoom);
      const ot = 0.25 - r;
      const tier1 = Math.min(ot, Math.max(0, 2 - otSoFarDay));
      const tier2 = ot - tier1;
      regularSoFar += r;
      otSoFarDay += ot;

      if (r > 0) {
        if (isWeekendOrHoliday) {
          h150s += r;
          rPay += r * base * 1.5;
        } else {
          h100 += r;
          rPay += r * base;
        }
        rHours += r;
      }
      if (tier1 > 0) {
        if (isWeekendOrHoliday) {
          h175s += tier1;
          ePay += tier1 * base * 1.75;
        } else {
          h125e += tier1;
          ePay += tier1 * base * 1.25;
        }
        eHours += tier1;
      }
      if (tier2 > 0) {
        if (isWeekendOrHoliday) {
          h200s += tier2;
          ePay += tier2 * base * 2;
        } else {
          h150e += tier2;
          ePay += tier2 * base * 1.5;
        }
        eHours += tier2;
      }
    }
    return {
      rPay,
      ePay,
      rHours,
      eHours,
      h100,
      h125e,
      h150e,
      h150s,
      h175s,
      h200s,
    };
  };

  const sundayCutoff = new Date(start);
  sundayCutoff.setDate(sundayCutoff.getDate() - sundayCutoff.getDay() + 7);
  sundayCutoff.setHours(4, 0, 0, 0);

  let res;
  if (start < sundayCutoff && end > sundayCutoff) {
    const p1 = calculateHours(start, sundayCutoff);
    const p2 = calculateHours(sundayCutoff, end, true);
    res = {
      p: p1.rPay + p1.ePay + p2.rPay + p2.ePay,
      rh: p1.rHours + p2.rHours,
      eh: p1.eHours + p2.eHours,
      rp: p1.rPay + p2.rPay,
      ep: p1.ePay + p2.ePay,
      h100: p1.h100 + p2.h100,
      h125e: p1.h125e + p2.h125e,
      h150e: p1.h150e + p2.h150e,
      h150s: p1.h150s + p2.h150s,
      h175s: p1.h175s + p2.h175s,
      h200s: p1.h200s + p2.h200s,
    };
  } else {
    const r = calculateHours(start, end);
    res = {
      p: r.rPay + r.ePay,
      rh: r.rHours,
      eh: r.eHours,
      rp: r.rPay,
      ep: r.ePay,
      h100: r.h100,
      h125e: r.h125e,
      h150e: r.h150e,
      h150s: r.h150s,
      h175s: r.h175s,
      h200s: r.h200s,
    };
  }

  const travel = Number(travelRate || 0);

  return {
    total_amount: Number((res.p + travel).toFixed(2)),
    reg_hours: Number(res.rh.toFixed(2)),
    extra_hours: Number(res.eh.toFixed(2)),
    reg_pay_amount: Number(res.rp.toFixed(2)),
    extra_pay_amount: Number(res.ep.toFixed(2)),
    travel_pay_amount: Number(travel.toFixed(2)),
    h100_hours: Number(res.h100.toFixed(2)),
    h125_extra_hours: Number(res.h125e.toFixed(2)),
    h150_extra_hours: Number(res.h150e.toFixed(2)),
    h175_extra_hours: isHoliday ? 0 : Number(res.h175s.toFixed(2)),
    h200_extra_hours: isHoliday ? 0 : Number(res.h200s.toFixed(2)),
    h150_shabat: isHoliday ? 0 : Number(res.h150s.toFixed(2)),
    h150_holiday: isHoliday ? Number(res.h150s.toFixed(2)) : 0,
    h175_holiday: isHoliday ? Number(res.h175s.toFixed(2)) : 0,
    h200_holiday: isHoliday ? Number(res.h200s.toFixed(2)) : 0,
  };
};
```

Add `DEFAULT_CALC_RULES` to the file's `module.exports`.

- [ ] **Step 4: Run the whole suite**

Run: `npx jest`
Expected: PASS — the 51 existing salary tests unchanged, plus the new weeklyOt calculator tests. If the midnight-split "12:00–04:00" case disagrees by a night-cap subtlety, fix the **test's expectation comment**, not the split logic: the night check is on the whole shift by spec §4.1.

- [ ] **Step 5: Commit**

```bash
git add utils/salaryLogic.js __tests__/weeklyOt.test.js
git commit -m "feat(salary): optional rules argument — weekly 42h cap, 8.6 daily norm, midnight split (defaults byte-identical)"
```

---

### Task 3: `computeShiftDoc` passes rules and records `weekly_regular_before`

**Files:**
- Modify: `utils/salaryLogic.js` (function `computeShiftDoc`)
- Test: `__tests__/weeklyOt.test.js` (append)

**Interfaces:**
- Produces: `computeShiftDoc({ startTime, endTime, baseRate, travelRate, type, isHoliday, rules })` — `rules` is the object from Task 1's `toCalcRules`. When `rules.weeklyRegularBefore` is a number, the returned doc carries `weekly_regular_before: <number>`; otherwise the key is absent. Training/vacation docs never carry it.

- [ ] **Step 1: Write the failing test** (append to `__tests__/weeklyOt.test.js`)

```js
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
    const doc = computeShiftDoc({ ...base, type: "training", rules: weekly(40) });
    expect(doc.is_training).toBe(true);
    expect("weekly_regular_before" in doc).toBe(false);
    expect(doc.total_amount).toBe(RATE * 8);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest __tests__/weeklyOt.test.js -t "computeShiftDoc"`
Expected: FAIL on "weekly rules → field recorded".

- [ ] **Step 3: Implement**

In `computeShiftDoc`, change the signature and the worked-shift branch:

```js
const computeShiftDoc = ({
  startTime,
  endTime,
  baseRate,
  travelRate = 0,
  type,
  isHoliday = false,
  rules,
}) => {
  if (type === "training" || type === "vacation") {
    // ... unchanged flat-day block ...
  }

  const result = calculateShiftPay(
    startTime,
    endTime,
    baseRate,
    travelRate,
    isHoliday,
    rules,
  );
  result.is_training = false;
  result.is_vacation = false;
  result.start_time = startTime;
  result.end_time = endTime;
  result.base_rate = Number(baseRate);
  result.is_holiday = !!isHoliday;
  // Recorded only when the weekly rule was applied, so the details screen
  // can explain the brackets and recompute passes can see the rule used.
  if (
    rules &&
    rules.weeklyRegularBefore !== null &&
    rules.weeklyRegularBefore !== undefined &&
    Number.isFinite(Number(rules.weeklyRegularBefore))
  ) {
    result.weekly_regular_before = Number(rules.weeklyRegularBefore);
  }
  return result;
};
```

- [ ] **Step 4: Run the suite**

Run: `npx jest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add utils/salaryLogic.js __tests__/weeklyOt.test.js
git commit -m "feat(salary): computeShiftDoc accepts rules and records weekly_regular_before"
```

---

### Task 4: Pure week helpers — `regularHoursBefore`, `recomputeWeek`

**Files:**
- Create: `utils/weeklyOt.js`
- Create: `lib/weeklyOtCore.js` (ESM re-export of the pure module; the Appwrite-aware `lib/weeklyOt.js` comes in Task 5)
- Test: `__tests__/weeklyOt.test.js` (append)

**Interfaces:**
- Consumes: `calculateShiftPay` (Task 2), `parseOvertimeRules`, `toCalcRules` (Task 1).
- Produces:
  - `weekStartOf(dateLike) → Date` (local Sunday 00:00), `weekEndOf(dateLike) → Date` (next Sunday 00:00, exclusive), `weekKeyOf(dateLike) → "YYYY-M-D"` of that Sunday.
  - `isWorkedDoc(doc) → boolean` (not training/vacation/sick).
  - `regularHoursBefore(weekDocs, shiftStartIso, excludeId?) → number`.
  - `recomputeWeek(weekDocs, rules) → Array<{ $id, ...15 pay fields, weekly_regular_before: number|null }>` — only docs whose stored values differ; `rules` is a parsed rules object (`{weekly, daily, midnightSplit}`).
  - `RECOMPUTE_FIELDS` — the 15 field names.

- [ ] **Step 1: Write the failing tests** (append)

```js
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
    doc("c", "2026-04-07T07:00:00", "2026-04-07T15:00:00", { is_training: true }), // ignored
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
  test("weekly on: only Friday changes (2 reg, 2@125, 4@150); earlier days get the field", () => {
    const updates = recomputeWeek(sixDays, WEEKLY);
    const byId = Object.fromEntries(updates.map((u) => [u.$id, u]));
    expect(byId.fri.h100_hours).toBe(2);
    expect(byId.fri.h125_extra_hours).toBe(2);
    expect(byId.fri.h150_extra_hours).toBe(4);
    expect(byId.fri.weekly_regular_before).toBe(40);
    // Sun–Thu numbers are unchanged but the field is newly recorded → they are updates too
    expect(byId.sun.weekly_regular_before).toBe(0);
    expect(byId.sun.h100_hours).toBe(8);
    expect(updates).toHaveLength(6);
  });
  test("stable: recomputing already-recomputed docs yields no updates", () => {
    const first = recomputeWeek(sixDays, WEEKLY);
    const applied = sixDays.map((d) => ({ ...d, ...(first.find((u) => u.$id === d.$id) || {}) }));
    expect(recomputeWeek(applied, WEEKLY)).toEqual([]);
  });
  test("weekly off restores daily-only numbers and clears the field", () => {
    const first = recomputeWeek(sixDays, WEEKLY);
    const applied = sixDays.map((d) => ({ ...d, ...(first.find((u) => u.$id === d.$id) || {}) }));
    const back = recomputeWeek(applied, DEFAULT_RULES);
    const fri = back.find((u) => u.$id === "fri");
    expect(fri.h100_hours).toBe(8);
    expect(fri.extra_hours).toBe(0);
    expect(fri.weekly_regular_before).toBeNull();
    // docs never computed under the weekly rule produce no update
    expect(recomputeWeek(sixDays, DEFAULT_RULES)).toEqual([]);
  });
  test("order is by start time regardless of input order", () => {
    const shuffled = [sixDays[5], sixDays[2], sixDays[0], sixDays[4], sixDays[1], sixDays[3]];
    const updates = recomputeWeek(shuffled, WEEKLY);
    expect(updates.find((u) => u.$id === "fri").weekly_regular_before).toBe(40);
    expect(updates.find((u) => u.$id === "sun").weekly_regular_before).toBe(0);
  });
  test("flat-day docs are ignored and contribute nothing", () => {
    const withFlat = [...sixDays, doc("sick", "2026-04-09T00:00:00", "2026-04-09T23:59:00", { is_sick: true, reg_hours: 8 })];
    const updates = recomputeWeek(withFlat, WEEKLY);
    expect(updates.find((u) => u.$id === "sick")).toBeUndefined();
    expect(updates.find((u) => u.$id === "fri").weekly_regular_before).toBe(40);
  });
  test("legacy end<start document recomputes to its own stored numbers (no spurious update)", () => {
    const legacy = { ...doc("n", "2026-04-06T22:00:00", "2026-04-07T06:00:00"), end_time: "2026-04-06T06:00:00" };
    expect(recomputeWeek([legacy], DEFAULT_RULES)).toEqual([]);
  });
  test("missing base_rate: skipped for rewriting but its reg_hours still advance the week", () => {
    const old = { ...doc("old", "2026-04-05T07:00:00", "2026-04-05T15:00:00"), base_rate: undefined };
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest __tests__/weeklyOt.test.js -t "recomputeWeek"`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement** `utils/weeklyOt.js`

```js
// Week context for the weekly overtime rule. Pure; CommonJS so Jest can
// require it. Appwrite-aware wrappers live in lib/weeklyOt.js.
//
// Week = local Sunday 00:00 → next Sunday 00:00 (exclusive). A shift belongs
// to the week it STARTS in. Only worked documents (not training / vacation /
// sick) contribute regular hours.

const { calculateShiftPay } = require("./salaryLogic");
const { parseOvertimeRules, toCalcRules } = require("./overtimeRules");

const RECOMPUTE_FIELDS = [
  "total_amount",
  "reg_hours",
  "extra_hours",
  "reg_pay_amount",
  "extra_pay_amount",
  "travel_pay_amount",
  "h100_hours",
  "h125_extra_hours",
  "h150_extra_hours",
  "h175_extra_hours",
  "h200_extra_hours",
  "h150_shabat",
  "h150_holiday",
  "h175_holiday",
  "h200_holiday",
];

const toDate = (v) => (v instanceof Date ? v : new Date(v));

const weekStartOf = (dateLike) => {
  const d = toDate(dateLike);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
};
const weekEndOf = (dateLike) => {
  const s = weekStartOf(dateLike);
  return new Date(s.getFullYear(), s.getMonth(), s.getDate() + 7);
};
const weekKeyOf = (dateLike) => {
  const s = weekStartOf(dateLike);
  return `${s.getFullYear()}-${s.getMonth()}-${s.getDate()}`;
};

const isWorkedDoc = (d) => !!d && !d.is_training && !d.is_vacation && !d.is_sick;

const byStart = (a, b) =>
  new Date(a.start_time).getTime() - new Date(b.start_time).getTime() ||
  String(a.$id).localeCompare(String(b.$id));

const regularHoursBefore = (weekDocs, shiftStartIso, excludeId) => {
  const t = new Date(shiftStartIso).getTime();
  return (weekDocs || [])
    .filter(
      (d) =>
        isWorkedDoc(d) &&
        (!excludeId || d.$id !== excludeId) &&
        new Date(d.start_time).getTime() < t,
    )
    .reduce((a, d) => a + Number(d.reg_hours || 0), 0);
};

const numOr0 = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

/**
 * Recompute every worked doc of one week in start order under `rules`.
 * Returns only the docs whose stored pay fields or weekly_regular_before
 * differ — ready for updateDocument. Never touches flat-day docs.
 */
const recomputeWeek = (weekDocs, rules) => {
  const r = parseOvertimeRules(rules);
  const sorted = (weekDocs || []).filter(isWorkedDoc).sort(byStart);
  let running = 0;
  const updates = [];
  for (const d of sorted) {
    const baseRate = Number(d.base_rate);
    if (!(baseRate > 0)) {
      // Too old to recompute; still counts toward the week.
      running += numOr0(d.reg_hours);
      continue;
    }
    const before = r.weekly ? running : null;
    const fresh = calculateShiftPay(
      d.start_time,
      d.end_time,
      baseRate,
      numOr0(d.travel_pay_amount),
      !!d.is_holiday,
      toCalcRules(r, before),
    );
    running += numOr0(fresh.reg_hours);

    const storedBefore =
      d.weekly_regular_before === undefined ? null : d.weekly_regular_before;
    const changed =
      RECOMPUTE_FIELDS.some((f) => numOr0(d[f]) !== numOr0(fresh[f])) ||
      storedBefore !== before;
    if (!changed) continue;

    const update = { $id: d.$id, weekly_regular_before: before };
    for (const f of RECOMPUTE_FIELDS) update[f] = fresh[f];
    updates.push(update);
  }
  return updates;
};

module.exports = {
  RECOMPUTE_FIELDS,
  weekStartOf,
  weekEndOf,
  weekKeyOf,
  isWorkedDoc,
  regularHoursBefore,
  recomputeWeek,
};
```

`lib/weeklyOtCore.js`:

```js
export {
  RECOMPUTE_FIELDS,
  isWorkedDoc,
  recomputeWeek,
  regularHoursBefore,
  weekEndOf,
  weekKeyOf,
  weekStartOf,
} from "../utils/weeklyOt";
```

- [ ] **Step 4: Run the suite**

Run: `npx jest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add utils/weeklyOt.js lib/weeklyOtCore.js __tests__/weeklyOt.test.js
git commit -m "feat(ot): pure week helpers — regularHoursBefore and minimal-diff recomputeWeek"
```

---

### Task 5: Appwrite week helpers + Add Shift / delete integration

**Files:**
- Create: `lib/weeklyOt.js`
- Modify: `app/add-shift.jsx` (save path; the block starting `const finalStart = new Date(date);` through the create/update call)
- Modify: `app/(tabs)/shifts.jsx` (`performDelete`)
- Modify: `translations/vocabulary.js` (`shifts.week_partial` in he/en/ar)

**Interfaces:**
- Consumes: Task 1 `parseOvertimeRules`, `toCalcRules`; Task 4 `regularHoursBefore`, `recomputeWeek`, `weekStartOf`, `weekEndOf`, `isWorkedDoc`; `listAllDocuments` (lib/appwriteList.js).
- Produces (lib/weeklyOt.js): `fetchWeekDocs(userId, dateLike) → Promise<doc[]>`; `applyWeekUpdates(updates) → Promise<{applied:number, failed:number}>`; `recomputeRange(userId, fromDate, toDate, rules) → Promise<{applied, failed, scanned}>`.

- [ ] **Step 1: Write `lib/weeklyOt.js`** (no unit test — it is I/O; behaviour is covered by Task 4's pure tests and the device checklist)

```js
import { Query } from "react-native-appwrite";
import { DATABASE_ID, databases, SHIFTS_HISTORY } from "./appwrite";
import { listAllDocuments } from "./appwriteList";
import { recomputeWeek, weekEndOf, weekKeyOf, weekStartOf } from "./weeklyOtCore";

// Appwrite-aware side of the weekly rule. Pure logic is in utils/weeklyOt.js.

export async function fetchWeekDocs(userId, dateLike) {
  const start = weekStartOf(dateLike).toISOString();
  const end = weekEndOf(dateLike).toISOString();
  return listAllDocuments(DATABASE_ID, SHIFTS_HISTORY, [
    Query.equal("user_id", userId),
    Query.greaterThanEqual("start_time", start),
    Query.lessThan("start_time", end),
    Query.orderAsc("start_time"),
  ]);
}

export async function applyWeekUpdates(updates) {
  const results = await Promise.allSettled(
    (updates || []).map(({ $id, ...fields }) =>
      databases.updateDocument(DATABASE_ID, SHIFTS_HISTORY, $id, fields),
    ),
  );
  const failed = results.filter((r) => r.status === "rejected").length;
  if (failed) {
    console.log(`[weeklyOt] ${failed}/${results.length} updates failed`);
  }
  return { applied: results.length - failed, failed };
}

/** Recompute every week overlapping [fromDate, toDate] under `rules`. */
export async function recomputeRange(userId, fromDate, toDate, rules) {
  const start = weekStartOf(fromDate).toISOString();
  const end = weekEndOf(toDate).toISOString();
  const docs = await listAllDocuments(DATABASE_ID, SHIFTS_HISTORY, [
    Query.equal("user_id", userId),
    Query.greaterThanEqual("start_time", start),
    Query.lessThan("start_time", end),
    Query.orderAsc("start_time"),
  ]);
  const weeks = new Map();
  for (const d of docs) {
    const k = weekKeyOf(d.start_time);
    if (!weeks.has(k)) weeks.set(k, []);
    weeks.get(k).push(d);
  }
  let applied = 0;
  let failed = 0;
  for (const weekDocs of weeks.values()) {
    const res = await applyWeekUpdates(recomputeWeek(weekDocs, rules));
    applied += res.applied;
    failed += res.failed;
  }
  return { applied, failed, scanned: docs.length };
}
```

- [ ] **Step 2: Wire Add Shift.** In `app/add-shift.jsx` add imports:

```js
import { parseOvertimeRules, toCalcRules } from "../lib/overtimeRules";
import { applyWeekUpdates, fetchWeekDocs } from "../lib/weeklyOt";
import { recomputeWeek, regularHoursBefore } from "../lib/weeklyOtCore";
```

Replace the block from `// Compute the shift document locally` through the create/update `if/else` with:

```js
      // Weekly rule (opt-in): fetch this week's shifts, count the regular
      // hours already used before this one, compute with that context, and
      // afterwards recompute any later shift in the same week.
      const otRules = parseOvertimeRules(profile?.overtime_rules);
      const isWorkedType = value !== "training";
      let weekDocs = [];
      let weeklyBefore = null;
      if (otRules.weekly && isWorkedType) {
        weekDocs = await fetchWeekDocs(user.$id, finalStart);
        weeklyBefore = regularHoursBefore(
          weekDocs,
          finalStart.toISOString(),
          isEditMode ? params.shiftId : undefined,
        );
      }

      const docData = computeShiftDoc({
        startTime: finalStart.toISOString(),
        endTime: finalEnd.toISOString(),
        baseRate: finalBaseRate,
        travelRate: profile.price_per_ride,
        type: value,
        isHoliday: value === "holiday",
        rules: otRules.weekly && isWorkedType ? toCalcRules(otRules, weeklyBefore) : undefined,
      });
      docData.user_id = user.$id;
      docData.comment = comment.trim();

      let saved;
      if (isEditMode && params.shiftId) {
        saved = await databases.updateDocument(
          DATABASE_ID,
          SHIFTS_HISTORY,
          params.shiftId,
          docData,
        );
      } else {
        saved = await databases.createDocument(
          DATABASE_ID,
          SHIFTS_HISTORY,
          ID.unique(),
          docData,
        );
      }

      // Later shifts in the week may now cross the cap earlier (or later).
      if (otRules.weekly && isWorkedType) {
        const others = weekDocs.filter((d) => d.$id !== saved.$id);
        const updates = recomputeWeek([...others, saved], otRules).filter(
          (u) => u.$id !== saved.$id,
        );
        if (updates.length) {
          const { failed } = await applyWeekUpdates(updates);
          if (failed) Alert.alert(t("shifts.week_partial"));
        }
      }
```

- [ ] **Step 3: Wire delete.** In `app/(tabs)/shifts.jsx` add imports:

```js
import { parseOvertimeRules } from "../../lib/overtimeRules";
import { applyWeekUpdates, fetchWeekDocs } from "../../lib/weeklyOt";
import { isWorkedDoc, recomputeWeek } from "../../lib/weeklyOtCore";
```

In `performDelete`, after `setShifts((prev) => prev.filter(...))` and the sick restreak branch, add:

```js
      const otRules = parseOvertimeRules(profile?.overtime_rules);
      if (otRules.weekly && isWorkedDoc(doc)) {
        const weekDocs = await fetchWeekDocs(user.$id, doc.start_time);
        const { failed } = await applyWeekUpdates(recomputeWeek(weekDocs, otRules));
        if (failed) Alert.alert(t("shifts.week_partial"));
      }
```

- [ ] **Step 4: Translations.** Insert into each `shifts: {` block (he, en, ar order):

```
he: week_partial: "חלק מהמשמרות בשבוע זה לא עודכנו לפי כלל 42 השעות. נסו לשמור שוב או לפתוח את הגדרות השעות הנוספות.",
en: week_partial: "Some shifts in this week could not be updated under the 42-hour rule. Try saving again or open the overtime settings.",
ar: week_partial: "تعذّر تحديث بعض ورديات هذا الأسبوع وفق قاعدة 42 ساعة. حاول الحفظ مجدداً أو افتح إعدادات الساعات الإضافية.",
```

- [ ] **Step 5: Lint and test**

Run: `npm run lint && npx jest`
Expected: 0 lint errors (3 pre-existing warnings), all tests pass.

- [ ] **Step 6: Commit**

```bash
git add lib/weeklyOt.js app/add-shift.jsx "app/(tabs)/shifts.jsx" translations/vocabulary.js
git commit -m "feat(ot): apply the weekly rule at save/delete time and recompute later shifts in the week"
```

---

### Task 6: Guard-sector rate presets

**Files:**
- Create: `utils/guardRates.js`, `lib/guardRates.js`, `components/common/GuardRateChips.jsx`
- Modify: `app/(auth)/setupPrefs.jsx` (under the hourly-rate `TextInput` in step 2), `components/profile/PreferencesChange.jsx` (under the hourly-rate input), `translations/vocabulary.js` (`guard_rates.*`)
- Test: `__tests__/guardRates.test.js`

**Interfaces:**
- Produces: `GUARD_RATES` (array of `{from, to, regular, supervisor, minWage}`), `currentGuardRates(date = new Date()) → { regular, supervisor, minWage, from, to, expired }`.
- `GuardRateChips({ value, onPick })` renders two chips + a note; `onPick(rateString)`.

- [ ] **Step 1: Failing test**

```js
/* global describe, test, expect */
const { GUARD_RATES, currentGuardRates } = require("../utils/guardRates");

describe("currentGuardRates", () => {
  test("inside the 2026 window", () => {
    const r = currentGuardRates(new Date(2026, 8, 27));
    expect(r).toMatchObject({ regular: 39.11, supervisor: 39.16, minWage: 35.4, expired: false });
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
```

- [ ] **Step 2: Run** `npx jest __tests__/guardRates.test.js` → FAIL (module missing).

- [ ] **Step 3: Implement**

`utils/guardRates.js`:

```js
// Minimum hourly rates under צו ההרחבה בענף השמירה והאבטחה, kept with their
// validity window so the app never presents a stale number as current.
// Source (Apr 2026): general minimum ₪6,443.85/mo (₪35.40/h); guard
// supplement ₪675 → ₪7,118.85/mo ÷ 182 h = ₪39.11; supervisor ₪683 → ₪39.16.
// Add a new row when the order is updated; keep old rows for history.
const GUARD_RATES = [
  { from: "2026-04-01", to: "2026-12-31", regular: 39.11, supervisor: 39.16, minWage: 35.4 },
];

const currentGuardRates = (date = new Date()) => {
  const d = date instanceof Date ? date : new Date(date);
  const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const hit = GUARD_RATES.find((r) => day >= r.from && day <= r.to);
  if (hit) return { ...hit, expired: false };
  return { ...GUARD_RATES[GUARD_RATES.length - 1], expired: true };
};

module.exports = { GUARD_RATES, currentGuardRates };
```

`lib/guardRates.js`:

```js
export { GUARD_RATES, currentGuardRates } from "../utils/guardRates";
```

`components/common/GuardRateChips.jsx`:

```jsx
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Chip, Text, useTheme } from "react-native-paper";
import { useLanguage } from "../../hooks/lang-context";
import { currentGuardRates } from "../../lib/guardRates";

// Two one-tap presets for the hourly rate: regular guard / supervisor, from
// the security-sector extension order, with the validity note. `value` is
// the current field string; `onPick` receives the rate as a string.
export default function GuardRateChips({ value, onPick }) {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const theme = useTheme();
  const rates = currentGuardRates();
  const isSel = (n) => Number(value) === n;
  const endDate = new Date(rates.to).toLocaleDateString("he-IL");
  return (
    <View style={{ marginTop: 8 }}>
      <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 8 }}>
        <Chip compact selected={isSel(rates.regular)} onPress={() => onPick(String(rates.regular))}>
          {`${t("guard_rates.regular")} · ₪${rates.regular}`}
        </Chip>
        <Chip compact selected={isSel(rates.supervisor)} onPress={() => onPick(String(rates.supervisor))}>
          {`${t("guard_rates.supervisor")} · ₪${rates.supervisor}`}
        </Chip>
      </View>
      <Text
        variant="bodySmall"
        style={{ marginTop: 6, color: theme.colors.onSurfaceVariant, textAlign: isRTL ? "right" : "left" }}
      >
        {rates.expired
          ? t("guard_rates.expired")
          : `${t("guard_rates.note")} ${endDate}`}
      </Text>
    </View>
  );
}
```

Translations (new block `guard_rates` inserted after each `edit_pref: {` block's siblings — add as a sibling block in he/en/ar):

```
he: guard_rates: { regular: "מאבטח", supervisor: "אחראי", note: "תעריף המינימום לפי צו ההרחבה בענף השמירה, בתוקף עד", expired: "התעריפים כאן עשויים להיות לא מעודכנים — בדקו את צו ההרחבה הנוכחי." },
en: guard_rates: { regular: "Guard", supervisor: "Supervisor", note: "Minimum rate under the security-sector extension order, valid until", expired: "These rates may be out of date — check the current extension order." },
ar: guard_rates: { regular: "حارس", supervisor: "مسؤول", note: "الحد الأدنى للأجر وفق أمر التوسيع لقطاع الحراسة، ساري حتى", expired: "قد تكون هذه الأجور غير محدّثة — راجع أمر التوسيع الحالي." },
```

Setup step 2: directly after the hourly-rate `TextInput` add
`<GuardRateChips value={formData.price_per_hour} onPick={(v) => setFormData((p) => ({ ...p, price_per_hour: v }))} />`.
Preferences modal: after the hourly-rate `TextInput` add
`<GuardRateChips value={formData.price_per_hour} onPick={(v) => setFormData((p) => ({ ...p, price_per_hour: v }))} />`.
Import `GuardRateChips` from `../../components/common/GuardRateChips` (setup) / `../common/GuardRateChips` (modal).

- [ ] **Step 4: Run** `npm run lint && npx jest` → PASS.

- [ ] **Step 5: Commit**

```bash
git add utils/guardRates.js lib/guardRates.js components/common/GuardRateChips.jsx "app/(auth)/setupPrefs.jsx" components/profile/PreferencesChange.jsx translations/vocabulary.js __tests__/guardRates.test.js
git commit -m "feat(rates): guard / supervisor rate presets with validity window"
```

---

### Task 7: Compliance flags + Overview card

**Files:**
- Create: `utils/compliance.js`, `lib/compliance.js`, `components/overview/ComplianceCard.jsx`
- Modify: `app/(tabs)/overview.jsx` (render the card after `InsightsCard`), `translations/vocabulary.js` (`compliance.*`)
- Test: `__tests__/compliance.test.js`

**Interfaces:**
- Consumes: Task 4 `weekKeyOf`, `isWorkedDoc`.
- Produces: `computeComplianceFlags(docs) → { longDays: string[] (ISO start_time), otWeeks: {weekKey, hours}[], shortRestWeeks: string[] }`; `LIMITS = { longDayHours: 12, weeklyOtHours: 16, restHours: 36, restMinWorkedDays: 6 }`.

- [ ] **Step 1: Failing test**

```js
/* global describe, test, expect */
const { computeComplianceFlags, LIMITS } = require("../utils/compliance");

const d = (id, start, end, extra = {}) => ({ $id: id, start_time: start, end_time: end, reg_hours: 8, extra_hours: 0, ...extra });

describe("computeComplianceFlags", () => {
  test("empty → no flags", () => {
    expect(computeComplianceFlags([])).toEqual({ longDays: [], otWeeks: [], shortRestWeeks: [] });
  });
  test("a 13 h shift is a long day; 12 h exactly is not", () => {
    const f = computeComplianceFlags([
      d("a", "2026-04-06T07:00:00", "2026-04-06T20:00:00"),
      d("b", "2026-04-07T07:00:00", "2026-04-07T19:00:00"),
    ]);
    expect(f.longDays).toEqual(["2026-04-06T07:00:00"]);
  });
  test("legacy end<start counts as overnight, not as a 23 h day", () => {
    const f = computeComplianceFlags([d("n", "2026-04-06T22:00:00", "2026-04-06T06:00:00")]);
    expect(f.longDays).toEqual([]);
  });
  test("a week with 17 overtime hours is flagged; 16 is not", () => {
    const week = [3, 4, 4, 3, 3].map((ot, i) =>
      d(`w${i}`, `2026-04-0${5 + i}T07:00:00`, `2026-04-0${5 + i}T18:00:00`, { extra_hours: ot }),
    );
    expect(computeComplianceFlags(week).otWeeks).toEqual([{ weekKey: "2026-3-5", hours: 17 }]);
    week[0].extra_hours = 2;
    expect(computeComplianceFlags(week).otWeeks).toEqual([]);
  });
  test("six worked days with no 36 h gap → short rest; five days → not evaluated", () => {
    const six = [5, 6, 7, 8, 9, 10].map((day) =>
      d(`s${day}`, `2026-04-${String(day).padStart(2, "0")}T07:00:00`, `2026-04-${String(day).padStart(2, "0")}T15:00:00`),
    );
    expect(computeComplianceFlags(six).shortRestWeeks).toEqual(["2026-3-5"]);
    expect(computeComplianceFlags(six.slice(0, 5)).shortRestWeeks).toEqual([]);
  });
  test("six worked days but one 40 h gap → no short-rest flag", () => {
    const six = [5, 6, 7, 9, 10, 11].map((day) =>
      d(`s${day}`, `2026-04-${String(day).padStart(2, "0")}T07:00:00`, `2026-04-${String(day).padStart(2, "0")}T15:00:00`),
    );
    expect(computeComplianceFlags(six).shortRestWeeks).toEqual([]);
  });
  test("flat-day docs are ignored", () => {
    const f = computeComplianceFlags([d("sick", "2026-04-06T00:00:00", "2026-04-06T23:59:00", { is_sick: true, extra_hours: 20 })]);
    expect(f).toEqual({ longDays: [], otWeeks: [], shortRestWeeks: [] });
  });
  test("limits are exposed", () => {
    expect(LIMITS).toEqual({ longDayHours: 12, weeklyOtHours: 16, restHours: 36, restMinWorkedDays: 6 });
  });
});
```

- [ ] **Step 2: Run** `npx jest __tests__/compliance.test.js` → FAIL.

- [ ] **Step 3: Implement** `utils/compliance.js`

```js
// Legal-limit flags for the Overview "worth knowing" card. Informational
// only — never changes pay. Evaluated on the documents passed in (one month),
// so weeks straddling month edges are judged on the visible part only.
const { isWorkedDoc, weekKeyOf } = require("./weeklyOt");

const LIMITS = Object.freeze({
  longDayHours: 12,
  weeklyOtHours: 16,
  restHours: 36,
  restMinWorkedDays: 6, // the 36h rest is only judged on weeks with 6+ worked days
});

const range = (d) => {
  const s = new Date(d.start_time);
  const e = new Date(d.end_time);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null;
  if (e < s) e.setDate(e.getDate() + 1);
  return { s, e, hours: (e - s) / 36e5 };
};

const computeComplianceFlags = (docs) => {
  const worked = (docs || []).filter(isWorkedDoc);
  const longDays = [];
  const weeks = new Map();

  for (const d of worked) {
    const r = range(d);
    if (!r) continue;
    if (r.hours > LIMITS.longDayHours) longDays.push(d.start_time);
    const k = weekKeyOf(d.start_time);
    if (!weeks.has(k)) weeks.set(k, { ot: 0, ranges: [], days: new Set() });
    const w = weeks.get(k);
    w.ot += Number(d.extra_hours || 0);
    w.ranges.push(r);
    w.days.add(`${r.s.getFullYear()}-${r.s.getMonth()}-${r.s.getDate()}`);
  }

  const otWeeks = [];
  const shortRestWeeks = [];
  for (const [weekKey, w] of weeks) {
    if (w.ot > LIMITS.weeklyOtHours) otWeeks.push({ weekKey, hours: Number(w.ot.toFixed(2)) });
    if (w.days.size >= LIMITS.restMinWorkedDays) {
      const sorted = [...w.ranges].sort((a, b) => a.s - b.s);
      let longestGap = 0;
      for (let i = 1; i < sorted.length; i += 1) {
        const gap = (sorted[i].s - sorted[i - 1].e) / 36e5;
        if (gap > longestGap) longestGap = gap;
      }
      if (longestGap < LIMITS.restHours) shortRestWeeks.push(weekKey);
    }
  }
  return { longDays, otWeeks, shortRestWeeks };
};

module.exports = { LIMITS, computeComplianceFlags };
```

`lib/compliance.js`: `export { LIMITS, computeComplianceFlags } from "../utils/compliance";`

`components/overview/ComplianceCard.jsx`:

```jsx
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useTheme } from "react-native-paper";
import { useLanguage } from "../../hooks/lang-context";
import { computeComplianceFlags } from "../../lib/compliance";
import { localeFromLang } from "../../lib/utils";
import Eyebrow from "../common/Eyebrow";
import Icon from "../common/Icon";
import Type from "../common/Type";

// "כדאי לדעת": legal limits crossed this month, in plain language. Rendered
// only when there is something to say. Never affects pay.
export default function ComplianceCard({ shifts }) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const { isRTL } = useLanguage();
  const flags = useMemo(() => computeComplianceFlags(shifts), [shifts]);
  const locale = localeFromLang(i18n.language);

  const lines = [];
  for (const iso of flags.longDays) {
    lines.push(t("compliance.long_day", { date: new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short" }) }));
  }
  for (const w of flags.otWeeks) {
    const sunday = new Date(...w.weekKey.split("-").map(Number));
    lines.push(t("compliance.weekly_ot", { week: sunday.toLocaleDateString(locale, { day: "numeric", month: "short" }), hours: w.hours }));
  }
  for (const k of flags.shortRestWeeks) {
    const sunday = new Date(...k.split("-").map(Number));
    lines.push(t("compliance.short_rest", { week: sunday.toLocaleDateString(locale, { day: "numeric", month: "short" }) }));
  }
  if (lines.length === 0) return null;

  return (
    <View
      style={{
        marginTop: 22,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        padding: 18,
      }}
    >
      <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
        <Icon name="shield" size={16} color={theme.colors.accent} />
        <Eyebrow color={theme.colors.muted}>{t("compliance.title")}</Eyebrow>
      </View>
      <View style={{ marginTop: 10, gap: 8 }}>
        {lines.map((line) => (
          <Type key={line} variant="body" color={theme.colors.ink} style={{ textAlign: isRTL ? "right" : "left" }}>
            {`• ${line}`}
          </Type>
        ))}
      </View>
      <Type variant="small" color={theme.colors.muted} style={{ marginTop: 12, textAlign: isRTL ? "right" : "left" }}>
        {t("compliance.footer")}
      </Type>
    </View>
  );
}
```

Translations (new `compliance` block in he/en/ar; i18next interpolation `{{...}}`):

```
he: compliance: { title: "כדאי לדעת", long_day: "ב-{{date}} עבדתם יותר מ-12 שעות ביום — מעבר למותר בחוק.", weekly_ot: "בשבוע שמתחיל ב-{{week}} נצברו {{hours}} שעות נוספות — יותר מ-16 המותרות.", short_rest: "בשבוע שמתחיל ב-{{week}} לא הייתה מנוחה שבועית של 36 שעות רצופות.", footer: "אלו מגבלות חוקיות שאפשר להעלות מול המעסיק. הן לא משנות את חישוב השכר." },
en: compliance: { title: "Worth knowing", long_day: "On {{date}} you worked more than 12 hours in a day — above the legal limit.", weekly_ot: "The week starting {{week}} has {{hours}} overtime hours — more than the 16 allowed.", short_rest: "The week starting {{week}} had no 36-hour continuous weekly rest.", footer: "These are legal limits you can raise with your employer. They don't change the pay calculation." },
ar: compliance: { title: "جدير بالمعرفة", long_day: "في {{date}} عملت أكثر من 12 ساعة في اليوم — فوق الحد القانوني.", weekly_ot: "الأسبوع الذي يبدأ في {{week}} يتضمن {{hours}} ساعة إضافية — أكثر من 16 المسموح بها.", short_rest: "الأسبوع الذي يبدأ في {{week}} لم يتضمن راحة أسبوعية متواصلة لمدة 36 ساعة.", footer: "هذه حدود قانونية يمكنك طرحها مع صاحب العمل. لا تغيّر حساب الراتب." },
```

Overview: import `ComplianceCard from "../../components/overview/ComplianceCard"` and render `<ComplianceCard shifts={shifts} />` directly after the `<InsightsCard ... />` element.

- [ ] **Step 4: Run** `npm run lint && npx jest` → PASS.

- [ ] **Step 5: Commit**

```bash
git add utils/compliance.js lib/compliance.js components/overview/ComplianceCard.jsx "app/(tabs)/overview.jsx" translations/vocabulary.js __tests__/compliance.test.js
git commit -m "feat(overview): compliance flags card — long day, weekly OT over 16h, short weekly rest"
```

---

### Task 8: Overtime settings modal + Preferences row + current-month recompute

**Files:**
- Create: `components/profile/OvertimeSettingsModal.jsx`
- Modify: `app/(tabs)/index.jsx` (new `SettingsRow` after the credit-points row; state `otOpen`; mount the modal next to the other modals), `translations/vocabulary.js` (`overtime.*`)

**Interfaces:**
- Consumes: Task 1 `parseOvertimeRules`, `serialiseOvertimeRules`, `DEFAULT_RULES`; Task 5 `recomputeRange`; `useAuth` (`user`, `profile`, `fetchUserProfile`); `useShiftsStore` (`fetchMonth`) to refresh the visible month after recompute.
- Produces: `OvertimeSettingsModal({ visible, onDismiss })`.

- [ ] **Step 1: Component**

```jsx
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet, View } from "react-native";
import {
  Button,
  Divider,
  IconButton,
  Modal,
  Portal,
  SegmentedButtons,
  Switch,
  Text,
  useTheme,
} from "react-native-paper";
import { useAuth } from "../../hooks/auth-context";
import { useLanguage } from "../../hooks/lang-context";
import { DATABASE_ID, USERS_PREFS, databases } from "../../lib/appwrite";
import {
  DEFAULT_RULES,
  parseOvertimeRules,
  serialiseOvertimeRules,
} from "../../lib/overtimeRules";
import { recomputeRange } from "../../lib/weeklyOt";
import LoadingSpinner from "../common/LoadingSpinnner";

// Three controls, all explained in one line each. Saving recomputes the
// CURRENT month's weeks under the new rules (owner decision); earlier
// months are never touched.
export default function OvertimeSettingsModal({ visible, onDismiss }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { user, profile, fetchUserProfile } = useAuth();
  const styles = makeStyle(theme, isRTL);
  const [rules, setRules] = useState({ ...DEFAULT_RULES });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) setRules(parseOvertimeRules(profile?.overtime_rules));
  }, [visible, profile?.overtime_rules]);

  const onSave = async () => {
    if (!profile?.$id || !user?.$id) return;
    setSaving(true);
    try {
      await databases.updateDocument(DATABASE_ID, USERS_PREFS, profile.$id, {
        overtime_rules: serialiseOvertimeRules(rules),
      });
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const { applied, failed } = await recomputeRange(user.$id, from, to, rules);
      await fetchUserProfile(user);
      onDismiss();
      if (failed) Alert.alert(t("overtime.recompute_partial", { failed }));
      else if (applied) Alert.alert(t("overtime.recomputed", { count: applied }));
    } catch (err) {
      console.log("Failed to save overtime rules:", err);
      Alert.alert(t("edit_pref.msg_err"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={saving ? undefined : onDismiss} contentContainerStyle={styles.modal}>
        <View style={styles.inner}>
          <View style={styles.header}>
            <Text style={styles.title}>{t("overtime.title")}</Text>
            <IconButton icon="close" size={20} onPress={onDismiss} disabled={saving} />
          </View>
          <Divider style={styles.divider} />

          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text variant="titleSmall" style={styles.label}>{t("overtime.weekly_label")}</Text>
              <Text variant="bodySmall" style={styles.hint}>{t("overtime.weekly_hint")}</Text>
            </View>
            <Switch value={rules.weekly} onValueChange={(v) => setRules((r) => ({ ...r, weekly: v }))} />
          </View>

          <Text variant="titleSmall" style={[styles.label, { marginTop: 18 }]}>{t("overtime.daily_label")}</Text>
          <SegmentedButtons
            value={String(rules.daily)}
            onValueChange={(v) => setRules((r) => ({ ...r, daily: Number(v) }))}
            buttons={[
              { value: "8", label: "8" },
              { value: "8.6", label: "8.6" },
            ]}
          />
          <Text variant="bodySmall" style={styles.hint}>{t("overtime.daily_hint")}</Text>

          <Text variant="titleSmall" style={[styles.label, { marginTop: 18 }]}>{t("overtime.midnight_label")}</Text>
          <SegmentedButtons
            value={rules.midnightSplit ? "split" : "continuous"}
            onValueChange={(v) => setRules((r) => ({ ...r, midnightSplit: v === "split" }))}
            buttons={[
              { value: "continuous", label: t("overtime.midnight_continuous") },
              { value: "split", label: t("overtime.midnight_split") },
            ]}
          />
          <Text variant="bodySmall" style={styles.hint}>{t("overtime.midnight_hint")}</Text>

          <Text variant="bodySmall" style={[styles.hint, { marginTop: 16 }]}>{t("overtime.save_note")}</Text>

          <Button mode="contained" onPress={onSave} disabled={saving} style={styles.save}>
            {t("edit_pref.btn")}
          </Button>
        </View>
        {saving && <LoadingSpinner overlay />}
      </Modal>
    </Portal>
  );
}

const makeStyle = (theme, isRTL) =>
  StyleSheet.create({
    modal: { backgroundColor: theme.colors.surface, margin: 20, borderRadius: 28, overflow: "hidden" },
    inner: { padding: 24 },
    header: { flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" },
    title: { fontSize: 22, fontWeight: "bold", color: theme.colors.onSurface },
    divider: { marginVertical: 12, opacity: 0.5 },
    rowBetween: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12 },
    label: { color: theme.colors.onSurface, textAlign: isRTL ? "right" : "left", marginBottom: 6 },
    hint: { color: theme.colors.onSurfaceVariant, textAlign: isRTL ? "right" : "left", marginTop: 6 },
    save: { marginTop: 20, borderRadius: 14 },
  });
```

- [ ] **Step 2: Translations** — add an `overtime` block (he/en/ar) and an `index.overtime` row label:

```
he: overtime: { title: "שעות נוספות", weekly_label: "חישוב שבועי — 42 שעות", weekly_hint: "מעבר ל-42 שעות רגילות בשבוע (ראשון עד שבת) כל שעה נחשבת נוספת, גם אם המשמרת קצרה.", daily_label: "שעות רגילות ביום", daily_hint: "8.6 = שבוע עבודה של 5 ימים לפי החוק. משמרת לילה תמיד 7.", midnight_label: "משמרת שחוצה חצות", midnight_continuous: "יום רצוף", midnight_split: "פיצול בחצות", midnight_hint: "החוק לא חד-משמעי. יום רצוף מיטיב עם העובד; פיצול בחצות הוא פרשנות בתי הדין.", save_note: "שמירה תחשב מחדש את משמרות החודש הנוכחי לפי הכללים החדשים. חודשים קודמים לא ישתנו.", recomputed: "{{count}} משמרות חושבו מחדש.", recompute_partial: "{{failed}} משמרות לא עודכנו. נסו לשמור שוב." },
   index.overtime: "שעות נוספות", index.overtime_weekly: "שבועי · {{daily}} שעות", index.overtime_daily: "יומי בלבד"
en: overtime: { title: "Overtime", weekly_label: "Weekly rule — 42 hours", weekly_hint: "Beyond 42 regular hours in a week (Sunday to Saturday) every hour counts as overtime, even in a short shift.", daily_label: "Regular hours per day", daily_hint: "8.6 = a 5-day work week under the law. Night shifts are always 7.", midnight_label: "Shift crossing midnight", midnight_continuous: "One day", midnight_split: "Split at midnight", midnight_hint: "The law is not settled. One day favours the worker; the midnight split follows the courts' reading.", save_note: "Saving recalculates this month's shifts under the new rules. Earlier months don't change.", recomputed: "{{count}} shifts recalculated.", recompute_partial: "{{failed}} shifts could not be updated. Try saving again." },
   index.overtime: "Overtime", index.overtime_weekly: "Weekly · {{daily}} h", index.overtime_daily: "Daily only"
ar: overtime: { title: "الساعات الإضافية", weekly_label: "قاعدة أسبوعية — 42 ساعة", weekly_hint: "بعد 42 ساعة عادية في الأسبوع (من الأحد إلى السبت) تُحسب كل ساعة إضافية، حتى في وردية قصيرة.", daily_label: "الساعات العادية في اليوم", daily_hint: "8.6 = أسبوع عمل من 5 أيام حسب القانون. الوردية الليلية دائماً 7.", midnight_label: "وردية تعبر منتصف الليل", midnight_continuous: "يوم واحد", midnight_split: "تقسيم عند منتصف الليل", midnight_hint: "القانون غير محسوم. اليوم الواحد لصالح العامل؛ التقسيم عند منتصف الليل هو تفسير المحاكم.", save_note: "الحفظ يعيد حساب ورديات هذا الشهر وفق القواعد الجديدة. الأشهر السابقة لا تتغير.", recomputed: "تمت إعادة حساب {{count}} وردية.", recompute_partial: "تعذّر تحديث {{failed}} وردية. حاول الحفظ مجدداً." },
   index.overtime: "الساعات الإضافية", index.overtime_weekly: "أسبوعي · {{daily}} ساعة", index.overtime_daily: "يومي فقط"
```

- [ ] **Step 3: Profile row.** In `app/(tabs)/index.jsx`: import `OvertimeSettingsModal` and `parseOvertimeRules`; add `const [otOpen, setOtOpen] = useState(false);`; after the credit-points `SettingsRow` add:

```jsx
            <SettingsRow
              isRTL={isRTL}
              icon="clock"
              label={t("index.overtime")}
              value={(() => {
                const r = parseOvertimeRules(profile?.overtime_rules);
                return r.weekly
                  ? t("index.overtime_weekly", { daily: r.daily })
                  : t("index.overtime_daily");
              })()}
              onPress={() => setOtOpen(true)}
            />
```

and mount `<OvertimeSettingsModal visible={otOpen} onDismiss={() => setOtOpen(false)} />` beside the other modals.

- [ ] **Step 4: Lint/test** → `npm run lint && npx jest` PASS.

- [ ] **Step 5: Commit**

```bash
git add components/profile/OvertimeSettingsModal.jsx "app/(tabs)/index.jsx" translations/vocabulary.js
git commit -m "feat(settings): overtime rules modal; saving recomputes the current month"
```

---

### Task 9: Shift details line, salary cache v2, project notes

**Files:**
- Modify: `app/shift-details.jsx` (rule text under duration), `lib/salaryCache.js` (`KEY_PREFIX`), `CLAUDE.md` (salary pipeline + rollback note), `translations/vocabulary.js` (`shiftDetails.weekly_before`)

- [ ] **Step 1: Details line.** In `app/shift-details.jsx`, directly under the existing rule `<Text variant="bodySmall" style={styles.ruleText}>…</Text>` inside the `isWorked` fragment, add:

```jsx
                {shift.weekly_regular_before !== undefined &&
                shift.weekly_regular_before !== null ? (
                  <Text variant="bodySmall" style={styles.ruleText}>
                    {t("shiftDetails.weekly_before", {
                      hours: hrs(shift.weekly_regular_before),
                    })}
                  </Text>
                ) : null}
```

Translations:

```
he: weekly_before: "לפני משמרת זו נצברו {{hours}} שעות רגילות השבוע; מעבר ל-42 השעות משולמות כשעות נוספות."
en: weekly_before: "{{hours}} regular hours were already used this week before this shift; beyond 42 they are paid as overtime."
ar: weekly_before: "تم استخدام {{hours}} ساعة عادية هذا الأسبوع قبل هذه الوردية؛ بعد 42 ساعة تُدفع كساعات إضافية."
```

- [ ] **Step 2: Cache.** In `lib/salaryCache.js` change `const KEY_PREFIX = "salary_cache:v1:";` to `"salary_cache:v2:"` and update the comment: "v2 (2026-09): weekly-OT recompute can change a month's totals for opted-in users; v1 entries must not be served."

- [ ] **Step 3: CLAUDE.md.** In the Salary pipeline section, replace the sentence claiming the cloud function is a byte-faithful rollback with:

> `calculateShiftPay` takes an optional `rules` argument (weekly 42 h cap, 8 / 8.6 daily norm, midnight split — see `utils/overtimeRules.js`, `utils/weeklyOt.js`, spec `docs/superpowers/specs/2026-09-27-weekly-overtime-design.md`). With `rules` omitted it is byte-identical to the historical function (test-locked). The `CALCULATE_SALARY` cloud function is **retired as a rollback path** — it has no weekly context — and remains deployed only for `DELETE_ACCOUNT`. Week context is injected at write time (`app/add-shift.jsx`, delete in `app/(tabs)/shifts.jsx`) and on rule changes (`components/profile/OvertimeSettingsModal.jsx` → `recomputeRange`, current month only). Optional document field: `weekly_regular_before`.

Also add `overtime_rules` (users_prefs) and `weekly_regular_before` (shifts_history) to the field lists.

- [ ] **Step 4: Full verification**

Run: `npm run lint && npx jest`
Expected: 0 lint errors; all suites pass (existing 229 + new overtimeRules 9, weeklyOt ~35, guardRates 3, compliance 8).

- [ ] **Step 5: Commit**

```bash
git add app/shift-details.jsx lib/salaryCache.js CLAUDE.md translations/vocabulary.js
git commit -m "feat(ot): explain weekly context in shift details; salary cache v2; notes"
```

---

## Whole-branch verification (before asking for merge)

1. `npx jest` and `npm run lint` green in the worktree.
2. `salary-logic-guardian` subagent on the staged diff: must confirm defaults byte-identical, nine-bucket contract intact, both new fields optional.
3. `code-reviewer` subagent on the diff.
4. Owner: both console attributes exist (spec §7).
5. Device checklist (dev build, Metro from `.worktrees/feat-weekly-ot`): toggle on with six 8 h shifts → Friday shows overtime and the details line; toggle off → back; add a 10 h shift early in the week → later shifts change; delete it → they revert; 8.6 on a 9 h shift → 0.4 h OT; midnight split on 20:00–06:00; presets fill the rate in setup and preferences; Overview card for a 13 h shift; Hebrew, English and Arabic copy render.
