// Derive a coarse type from a shift document so the list can render the
// right icon + label. Falls back to start-hour heuristics so older
// documents without is_* flags still classify reasonably.
import { getShiftTimes } from "./shiftTimes";

const inRange = (hour, range) => {
  if (!range) return false;
  const [from, to] = range;
  if (from <= to) return hour >= from && hour < to;
  // wraps midnight (e.g. night 22:00–06:00)
  return hour >= from || hour < to;
};

export function deriveShiftType(shift, userPrefs) {
  if (!shift) return "morning";
  if (shift.is_training) return "training";
  if (shift.is_vacation) return "vacation";
  if (shift.is_holiday) return "shabbat";
  const start = shift.start_time ? new Date(shift.start_time) : null;
  if (!start || Number.isNaN(start.getTime())) return "morning";
  if (start.getDay() === 6 || start.getDay() === 5) {
    // Friday evening / Saturday → shabbat
    if (start.getDay() === 5 && start.getHours() < 16) {
      // fall through to time-of-day classification
    } else {
      return "shabbat";
    }
  }
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
  training: "briefcase",
  vacation: "palm",
};
