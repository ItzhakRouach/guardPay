import AsyncStorage from "@react-native-async-storage/async-storage";

// Stale-while-revalidate cache for the CALCULATE_SALARY cloud function
// response. Each (user, year, month) tuple gets its own slot so a user
// flipping between months sees the previous report instantly while a
// fresh cloud-function call runs in the background.
//
// Versioned key prefix so we can ship a breaking schema change later
// without touching old entries that the app would silently misinterpret.

const KEY_PREFIX = "salary_cache:v1:";

const buildKey = (userId, year, month) =>
  `${KEY_PREFIX}${userId}:${year}-${String(month).padStart(2, "0")}`;

export const readSalaryCache = async (userId, year, month) => {
  if (!userId || year == null || month == null) return null;
  try {
    const raw = await AsyncStorage.getItem(buildKey(userId, year, month));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Defensive: only return objects that look like a salary report.
    // Older / corrupted entries return null so callers fall back to a
    // fresh cloud-function call.
    if (
      parsed &&
      typeof parsed === "object" &&
      "bruto" in parsed &&
      "neto" in parsed
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
};

export const writeSalaryCache = async (userId, year, month, report) => {
  if (!userId || year == null || month == null || !report) return;
  try {
    await AsyncStorage.setItem(
      buildKey(userId, year, month),
      JSON.stringify(report),
    );
  } catch {
    // Swallow — caching is an optimization, not load-bearing.
  }
};
