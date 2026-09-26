// Thin ESM re-export of the CommonJS classifier so app code can import it
// with the same syntax as the rest of lib/ (mirrors lib/salaryLogic.js).
import * as errors from "../utils/appwriteErrors";

export const classifyAppwriteError = errors.classifyAppwriteError;
export const isBackendUnavailable = errors.isBackendUnavailable;
