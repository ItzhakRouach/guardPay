// ESM re-export of the pure CJS logic in utils/shiftTimes.js so app code
// imports from one place (lib/*). Tests require the CJS module directly.
export {
  DEFAULT_SHIFT_TIMES,
  CUSTOMISABLE_TYPES,
  parseHHMM,
  isValidTimeObject,
  formatTimeRange,
  parseUserShiftTimes,
  serialiseUserShiftTimes,
  getShiftTimes,
} from "../utils/shiftTimes";
