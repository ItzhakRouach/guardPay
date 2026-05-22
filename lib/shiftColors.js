// ESM re-export of the pure CJS logic in utils/shiftColors.js so app code
// imports from one place (lib/*). Tests require the CJS module directly.
export {
  SWATCHES,
  DARK_MODE_LOOKUP,
  DEFAULT_COLORS,
  parseUserColors,
  resolveTint,
  serialiseUserColors,
} from "../utils/shiftColors";
