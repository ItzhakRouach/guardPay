import { useEffect, useState } from "react";
import { Query } from "react-native-appwrite";
import { DATABASE_ID, databases, SHIFTS_HISTORY } from "../lib/appwrite";

// Lifetime stats for the Profile header.
//
//   - totalShifts: every shifts_history doc for this user.
//   - activeMonths: distinct (year, month) buckets across those docs.
//                   "March 2026" and "April 2026" count as 2 months even if
//                   only a single shift was logged in April.
//
// Cursor-paginated up to a hard cap of 20k docs so heavy users still get
// an accurate count without pulling the entire collection on profile
// open. Both numbers stay null while loading so the Profile screen can
// show "—" rather than 0.
const PAGE = 100;
const MAX_PAGES = 200;

export function useProfileStats(user) {
  const [stats, setStats] = useState({ totalShifts: null, activeMonths: null });

  useEffect(() => {
    if (!user?.$id) return;
    let cancelled = false;

    (async () => {
      let total = 0;
      const monthSet = new Set();
      let cursor = null;

      try {
        for (let i = 0; i < MAX_PAGES; i += 1) {
          const queries = [
            Query.equal("user_id", user.$id),
            Query.orderAsc("$id"),
            Query.limit(PAGE),
          ];
          if (cursor) queries.push(Query.cursorAfter(cursor));

          const res = await databases.listDocuments(
            DATABASE_ID,
            SHIFTS_HISTORY,
            queries,
          );
          if (cancelled) return;

          const docs = res.documents || [];
          if (docs.length === 0) break;

          total += docs.length;
          docs.forEach((s) => {
            const d = new Date(s.start_time);
            if (Number.isNaN(d.getTime())) return;
            monthSet.add(`${d.getFullYear()}-${d.getMonth()}`);
          });

          if (docs.length < PAGE) break;
          cursor = docs[docs.length - 1].$id;
        }

        if (!cancelled) {
          setStats({ totalShifts: total, activeMonths: monthSet.size });
        }
      } catch (err) {
        if (!cancelled) {
          // Distinguish a failed fetch (null) from a confirmed-empty
          // account (0) so the UI keeps showing "—" rather than a
          // misleading zero.
          console.error("useProfileStats: fetch failed", err);
          setStats({ totalShifts: null, activeMonths: null });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.$id]);

  return stats;
}
