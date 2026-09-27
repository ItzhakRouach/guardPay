import { Query } from "react-native-appwrite";
import { DATABASE_ID, databases, SHIFTS_HISTORY } from "./appwrite";
import { listAllDocuments } from "./appwriteList";
import {
  recomputeWeek,
  weekEndOf,
  weekKeyOf,
  weekStartOf,
} from "./weeklyOtCore";

// Appwrite-aware side of the weekly rule. Pure logic is in utils/weeklyOt.js.

export async function fetchWeekDocs(userId, dateLike) {
  const start = weekStartOf(dateLike).toISOString();
  const end = weekEndOf(dateLike).toISOString();
  return listAllDocuments(DATABASE_ID, SHIFTS_HISTORY, [
    Query.equal("user_id", userId),
    Query.greaterThanEqual("start_time", start),
    Query.lessThan("start_time", end),
    Query.orderAsc("start_time"),
  ]);
}

export async function applyWeekUpdates(updates) {
  const results = await Promise.allSettled(
    (updates || []).map(({ $id, ...fields }) =>
      databases.updateDocument(DATABASE_ID, SHIFTS_HISTORY, $id, fields),
    ),
  );
  const failed = results.filter((r) => r.status === "rejected").length;
  if (failed) {
    console.log(`[weeklyOt] ${failed}/${results.length} updates failed`);
  }
  return { applied: results.length - failed, failed };
}

/** Recompute every week overlapping [fromDate, toDate] under `rules`. */
export async function recomputeRange(userId, fromDate, toDate, rules) {
  const start = weekStartOf(fromDate).toISOString();
  const end = weekEndOf(toDate).toISOString();
  const docs = await listAllDocuments(DATABASE_ID, SHIFTS_HISTORY, [
    Query.equal("user_id", userId),
    Query.greaterThanEqual("start_time", start),
    Query.lessThan("start_time", end),
    Query.orderAsc("start_time"),
  ]);
  const weeks = new Map();
  for (const d of docs) {
    const k = weekKeyOf(d.start_time);
    if (!weeks.has(k)) weeks.set(k, []);
    weeks.get(k).push(d);
  }
  let applied = 0;
  let failed = 0;
  for (const weekDocs of weeks.values()) {
    const res = await applyWeekUpdates(recomputeWeek(weekDocs, rules));
    applied += res.applied;
    failed += res.failed;
  }
  return { applied, failed, scanned: docs.length };
}
