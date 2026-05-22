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
// Caps at 5000 documents — beyond that we accept the small under-count.
// Both numbers stay null while loading so the Profile screen can show "—".
export function useProfileStats(user) {
  const [stats, setStats] = useState({ totalShifts: null, activeMonths: null });

  useEffect(() => {
    if (!user?.$id) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await databases.listDocuments(
          DATABASE_ID,
          SHIFTS_HISTORY,
          [Query.equal("user_id", user.$id), Query.limit(5000)],
        );
        if (cancelled) return;
        const docs = res.documents || [];
        const monthSet = new Set();
        docs.forEach((s) => {
          const d = new Date(s.start_time);
          if (Number.isNaN(d.getTime())) return;
          monthSet.add(`${d.getFullYear()}-${d.getMonth()}`);
        });
        setStats({ totalShifts: docs.length, activeMonths: monthSet.size });
      } catch {
        if (!cancelled) {
          setStats({ totalShifts: 0, activeMonths: 0 });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.$id]);

  return stats;
}
