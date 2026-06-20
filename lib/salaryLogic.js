// Thin ESM re-export of the CommonJS source of truth in
// utils/salaryLogic.js (same pattern as lib/shiftType.js). Keeping the
// logic in one CJS file lets the Jest suite require() it without babel,
// while app code imports from here.
export {
  calculateSalary,
  calculateShiftPay,
  computeShiftDoc,
} from "../utils/salaryLogic";
