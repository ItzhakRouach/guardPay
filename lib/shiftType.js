// Derive a coarse type from a shift document so the list can render the
// right icon + label. Mirrors the priority used by lib/shiftColors.js
// (`resolveTint`) so icon, label, and tint always tell the same story.
//
// Priority (first match wins):
//   1. is_holiday   → holiday
//   2. is_training  → training
//   3. is_vacation  → vacation
//   4. Saturday     → shabbat
//   5. Friday       → friday  (its own type — not shabbat)
//   6. otherwise    → morning / evening / night based on start hour
import { getShiftTimes } from "./shiftTimes";

const inRange = (hour, range) => {
  if (!range) return false;
  const [from, to] = range;
  if (from <= to) return hour >= from && hour < to;
  // Wraps midnight (e.g. night 22:00–06:00).
  return hour >= from || hour < to;
};

export function deriveShiftType(shift, userPrefs) {
  if (!shift) return "morning";
  if (shift.is_holiday) return "holiday";
  if (shift.is_training) return "training";
  if (shift.is_vacation) return "vacation";

  const start = shift.start_time ? new Date(shift.start_time) : null;
  if (!start || Number.isNaN(start.getTime())) return "morning";

  const day = start.getDay();
  if (day === 6) return "shabbat";
  if (day === 5) return "friday";

  const times = getShiftTimes(userPrefs);
  const hour = start.getHours() + start.getMinutes() / 60;
  if (inRange(hour, times?.night)) return "night";
  if (inRange(hour, times?.evening)) return "evening";
  return "morning";
}

export const TYPE_ICON = {
  morning: "sun",
  evening: "sunset",
  night: "moon",
  shabbat: "moon",
  friday: "sunset",
  holiday: "sparkle",
  training: "briefcase",
  vacation: "palm",
};
