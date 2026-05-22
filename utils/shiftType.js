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

const {
  DEFAULT_SHIFT_TIMES,
  parseUserShiftTimes,
} = require("./shiftTimes");

const toMinutes = ({ startH, startM, endH, endM }) => ({
  from: startH * 60 + startM,
  to: endH * 60 + endM,
});

// Returns true when `mins` (minutes since 00:00) falls inside the
// window. Windows that cross midnight (e.g. night 23:00 → 07:00) have
// from > to — the contained range is [from, 24:00) ∪ [00:00, to).
const inWindow = (mins, range) => {
  if (!range) return false;
  const { from, to } = range;
  if (from === to) return false;
  if (from < to) return mins >= from && mins < to;
  return mins >= from || mins < to;
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

  const times =
    parseUserShiftTimes(userPrefs && userPrefs.default_shift_times) ||
    DEFAULT_SHIFT_TIMES;
  const mins = start.getHours() * 60 + start.getMinutes();

  // Night check first — its window crosses midnight and would otherwise
  // be masked by an early-morning fall-through.
  if (inWindow(mins, toMinutes(times.night))) return "night";
  if (inWindow(mins, toMinutes(times.evening))) return "evening";
  return "morning";
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

module.exports = { deriveShiftType, TYPE_ICON };
