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
  if (raw === undefined || raw === null || raw === "")
    return { ...DEFAULT_RULES };
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
  if (typeof parsed.midnightSplit === "boolean") {
    out.midnightSplit = parsed.midnightSplit;
  }
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
