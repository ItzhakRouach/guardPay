// Derive a coarse type from a shift document so the list can render the
// right icon + label. Mirrors the priority used by utils/shiftColors.js
// (`resolveTint`) so icon, label, and tint always tell the same story.
//
// Priority (first match wins):
//   1. is_sick     → sick
//   2. is_holiday  → holiday
//   3. is_training → training
//   4. is_vacation → vacation
//   5. Saturday    → shabbat
//   6. Friday      → friday   (its own type — not shabbat)
//   7. otherwise   → morning / evening / night based on start hour
//                     against the user's customisable defaults from
//                     profile.default_shift_times.
//
// Kept as CommonJS so the Jest test suite can `require()` it directly
// without a babel config — matches utils/decimal.js / utils/shiftColors.js.
// App code imports from lib/shiftType.js (a thin ESM re-export).

const { DEFAULT_SHIFT_TIMES, parseUserShiftTimes } = require("./shiftTimes");

const toMinutes = ({ startH, startM, endH, endM }) => ({
  from: startH * 60 + startM,
  to: endH * 60 + endM,
});

// Returns true when `mins` (minutes since 00:00) falls inside the
// window. Windows that cross midnight (e.g. night 23:00 → 07:00) have
// from > to — the contained range is [from, 24:00) ∪ [00:00, to).
//
// `from === to` is interpreted as a 24-hour window (the user set start
// equal to end, presumably to mean "this type covers the whole day").
// Returning false here would silently drop every shift into the next
// bucket — the 24-hour interpretation is the less-surprising failure
// mode for a degenerate user-saved window.
const inWindow = (mins, range) => {
  if (!range) return false;
  const { from, to } = range;
  if (from === to) return true;
  if (from < to) return mins >= from && mins < to;
  return mins >= from || mins < to;
};

// Minutes of [from, to) (minutes since a reference midnight, may exceed
// 1440 for a shift that crosses midnight) that fall inside a daily window.
// The window repeats every day, so test the two calendar days the range
// can touch.
const overlapMinutes = (from, to, range) => {
  if (!range) return 0;
  const segs = [];
  for (const dayOffset of [0, 1440, 2880]) {
    if (range.from < range.to) {
      segs.push([range.from + dayOffset, range.to + dayOffset]);
    } else if (range.from === range.to) {
      segs.push([dayOffset, dayOffset + 1440]);
    } else {
      segs.push([range.from + dayOffset, 1440 + dayOffset]);
      segs.push([dayOffset, range.to + dayOffset]);
    }
  }
  let total = 0;
  for (const [a, b] of segs) {
    const lo = Math.max(from, a);
    const hi = Math.min(to, b);
    if (hi > lo) total += hi - lo;
  }
  return total;
};

/**
 * Which of morning / evening / night a worked shift is, by where MOST of
 * its hours fall against the user's windows (start hour alone misfiled a
 * 13:00–22:00 shift as morning). Ties go to the window containing the start.
 * With no valid end, falls back to the start-hour rule.
 */
const classifyTimeOfDay = (startDate, endDate, userPrefs) => {
  const start = startDate instanceof Date ? startDate : new Date(startDate);
  if (Number.isNaN(start.getTime())) return "morning";
  const times =
    parseUserShiftTimes(userPrefs && userPrefs.default_shift_times) ||
    DEFAULT_SHIFT_TIMES;
  const windows = {
    night: toMinutes(times.night),
    evening: toMinutes(times.evening),
    morning: toMinutes(times.morning),
  };
  const startMins = start.getHours() * 60 + start.getMinutes();
  const byStart = inWindow(startMins, windows.night)
    ? "night"
    : inWindow(startMins, windows.evening)
      ? "evening"
      : "morning";

  const end =
    endDate instanceof Date ? endDate : endDate ? new Date(endDate) : null;
  if (!end || Number.isNaN(end.getTime())) return byStart;
  let endMins = startMins + Math.round((end - start) / 60000);
  if (endMins <= startMins) endMins += 1440; // legacy end<start = overnight
  if (endMins - startMins > 1440) return byStart;

  let best = byStart;
  let bestMins = -1;
  for (const type of ["night", "evening", "morning"]) {
    const m = overlapMinutes(startMins, endMins, windows[type]);
    if (m > bestMins || (m === bestMins && type === byStart)) {
      best = type;
      bestMins = m;
    }
  }
  return bestMins > 0 ? best : byStart;
};

const deriveShiftType = (shift, userPrefs) => {
  if (!shift) return "morning";
  if (shift.is_sick) return "sick";
  if (shift.is_holiday) return "holiday";
  if (shift.is_training) return "training";
  if (shift.is_vacation) return "vacation";

  const start = shift.start_time ? new Date(shift.start_time) : null;
  if (!start || Number.isNaN(start.getTime())) return "morning";

  const day = start.getDay();
  if (day === 6) return "shabbat";
  if (day === 5) return "friday";

  // Majority-of-hours when the document has an end time; start-hour rule
  // otherwise (same answer for every preset-shaped shift).
  return classifyTimeOfDay(start, shift.end_time, userPrefs);
};

const TYPE_ICON = {
  morning: "sun",
  evening: "sunset",
  night: "moon",
  shabbat: "moon",
  friday: "sunset",
  holiday: "star",
  sick: "shield",
  training: "briefcase",
  vacation: "palm",
};

module.exports = { classifyTimeOfDay, deriveShiftType, TYPE_ICON };
