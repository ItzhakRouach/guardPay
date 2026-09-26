// Classifies an error thrown by the Appwrite SDK (or by fetch underneath it)
// into one of five kinds, so callers can tell "the backend is unreachable"
// apart from "this user has no session".
//
// Why this exists: Appwrite Cloud's Free plan pauses a project after 7 days
// without Console activity. While paused, every API call fails with
// HTTP 403 `project_paused`. The auth bootstrap used to treat *any* failure
// of `account.get()` as "signed out" and route the user to onboarding, so a
// paused backend looked like a lost account. See docs/ops/appwrite-keepalive.md.
//
// CommonJS on purpose (same as utils/salaryLogic.js) so Jest can require it
// without pulling in react-native-appwrite. `lib/appwriteErrors.js` re-exports
// it for app code.

const KINDS = ["paused", "network", "server", "unauthorized", "unknown"];

const PAUSED_TYPES = new Set(["project_paused", "general_resource_blocked"]);

const UNAUTHORIZED_TYPES = new Set([
  "general_unauthorized_scope", // account.get() with no session
  "user_unauthorized",
  "user_session_not_found",
  "user_jwt_invalid",
  "user_invalid_token",
]);

const NETWORK_MESSAGE =
  /network request failed|failed to fetch|networkerror|timeout|timed out|econnrefused|econnreset|enotfound|aborted/i;

function classifyAppwriteError(err) {
  if (!err || typeof err !== "object") return "unknown";

  const code = typeof err.code === "number" ? err.code : null;
  const type = typeof err.type === "string" ? err.type : "";
  const message = typeof err.message === "string" ? err.message : "";

  if (PAUSED_TYPES.has(type)) return "paused";
  // Defensive: if Cloud ever renames the type, a 403 that talks about a
  // pause must still be recognised — misclassifying it as "unknown" would
  // sign the user out, which is the exact bug this module exists to fix.
  if (code === 403 && /paused/i.test(`${type} ${message}`)) return "paused";

  if (code === 401 || UNAUTHORIZED_TYPES.has(type)) return "unauthorized";

  if (code !== null && (code >= 500 || code === 429)) return "server";

  // No HTTP status at all: fetch never got a response. Covers TypeError
  // "Network request failed" (RN), "Failed to fetch" (web), AbortError, and
  // the SDK's own code:0 shape for connection failures.
  if (code === null || code === 0) {
    if (err.name === "AbortError" || err.name === "TypeError") return "network";
    if (NETWORK_MESSAGE.test(message)) return "network";
    // react-native-appwrite re-wraps transport failures as
    // AppwriteException(message) with code 0 and an empty type — by
    // construction "no HTTP response was received".
    if (code === 0 && type === "") return "network";
  }

  return "unknown";
}

// "Unavailable" = nothing the user did; retrying later will work.
function isBackendUnavailable(kind) {
  return kind === "paused" || kind === "network" || kind === "server";
}

module.exports = { classifyAppwriteError, isBackendUnavailable, KINDS };
