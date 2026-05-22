// Pure helpers for the user-customisable shift-time defaults
// (morning / evening / night).
//
// Kept as CommonJS so the Jest test suite can `require()` it directly
// without a babel config — matches utils/decimal.js / utils/shiftColors.js.
// App code imports from lib/shiftTimes.js (an ESM re-export).

// Hard-coded defaults (same values that lived in lib/utils.js
// `shiftTypeTimes` before the customisation feature). Training, vacation,
// and holiday aren't customisable — they're really day-long markers
// rather than time presets.
const DEFAULT_SHIFT_TIMES = {
  morning: { startH: 7, startM: 0, endH: 15, endM: 0 },
  evening: { startH: 15, startM: 0, endH: 23, endM: 0 },
  night: { startH: 23, startM: 0, endH: 7, endM: 0 },
};

const CUSTOMISABLE_TYPES = ["morning", "evening", "night"];

const pad2 = (n) => String(n).padStart(2, "0");

// "07:00 - 15:00" formatter, used in the row preview.
const formatTimeRange = ({ startH, startM, endH, endM }) =>
  `${pad2(startH)}:${pad2(startM)} - ${pad2(endH)}:${pad2(endM)}`;

// Parse "HH:MM" → { hour, minute } or null if invalid.
// Accepts 1-2 digit hours/minutes, leading zero optional.
const parseHHMM = (str) => {
  if (typeof str !== "string") return null;
  const m = str.trim().match(/^(\d{1,2}):(\d{1,2})$/);
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return null;
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) return null;
  return { hour, minute };
};

// Validate a full { startH, startM, endH, endM } object.
const isValidTimeObject = (obj) =>
  !!obj &&
  Number.isInteger(obj.startH) &&
  obj.startH >= 0 &&
  obj.startH <= 23 &&
  Number.isInteger(obj.startM) &&
  obj.startM >= 0 &&
  obj.startM <= 59 &&
  Number.isInteger(obj.endH) &&
  obj.endH >= 0 &&
  obj.endH <= 23 &&
  Number.isInteger(obj.endM) &&
  obj.endM >= 0 &&
  obj.endM <= 59;

// Safe parse of the JSON stored in users_prefs.default_shift_times.
// Returns a complete {morning, evening, night} object with defaults
// filling any missing or invalid entries.
const parseUserShiftTimes = (raw) => {
  if (raw === undefined || raw === null || raw === "") {
    return { ...DEFAULT_SHIFT_TIMES };
  }
  let parsed;
  try {
    parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return { ...DEFAULT_SHIFT_TIMES };
  }
  if (!parsed || typeof parsed !== "object") {
    return { ...DEFAULT_SHIFT_TIMES };
  }
  const result = { ...DEFAULT_SHIFT_TIMES };
  for (const type of CUSTOMISABLE_TYPES) {
    if (isValidTimeObject(parsed[type])) {
      result[type] = {
        startH: parsed[type].startH,
        startM: parsed[type].startM,
        endH: parsed[type].endH,
        endM: parsed[type].endM,
      };
    }
  }
  return result;
};

// Build the JSON string for Appwrite. Mirrors serialiseUserColors —
// only includes entries that differ from defaults, so the field stays
// small and future default-tweaks don't get overridden by stale stored
// values.
const serialiseUserShiftTimes = (times) => {
  const diff = {};
  for (const type of CUSTOMISABLE_TYPES) {
    const t = times?.[type];
    if (!t || !isValidTimeObject(t)) continue;
    const d = DEFAULT_SHIFT_TIMES[type];
    if (
      t.startH !== d.startH ||
      t.startM !== d.startM ||
      t.endH !== d.endH ||
      t.endM !== d.endM
    ) {
      diff[type] = t;
    }
  }
  return JSON.stringify(diff);
};

// Lookup helper used at preset-apply time in Add Shift. Falls back to
// defaults for unknown types or missing user prefs.
const getShiftTimes = (type, userJson) => {
  const userTimes = parseUserShiftTimes(userJson);
  return userTimes[type] || DEFAULT_SHIFT_TIMES[type] || null;
};

module.exports = {
  DEFAULT_SHIFT_TIMES,
  CUSTOMISABLE_TYPES,
  parseHHMM,
  isValidTimeObject,
  formatTimeRange,
  parseUserShiftTimes,
  serialiseUserShiftTimes,
  getShiftTimes,
};
