import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import { Query } from "react-native-appwrite";
import { applyStatsEvent, statsFromDocs } from "../lib/activeMonths";
import { DATABASE_ID, databases, SHIFTS_HISTORY } from "../lib/appwrite";
import { listAllDocuments } from "../lib/appwriteList";
import { useShiftsStore } from "./shifts-store";

// Lifetime stats for the Profile header.
//
//   totalShifts  — one count query (Appwrite returns `total` with limit 1).
//   activeMonths — distinct local (year, month) buckets. Computing this needs
//                  the whole history, so it is scanned ONCE, cached on the
//                  device, and only rescanned when the count no longer
//                  matches the cache or a delete may have emptied a month.
//
// Previously every Profile visit paginated the entire history (up to 20k
// documents) to show these two integers.
//
// Both numbers stay null while loading / on failure so the screen shows
// "—" rather than a misleading 0.

const CACHE_PREFIX = "profile_stats:v1:";
const RESCAN_DEBOUNCE_MS = 2000;

const readCache = async (uid) => {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + uid);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const writeCache = async (uid, stats) => {
  try {
    await AsyncStorage.setItem(CACHE_PREFIX + uid, JSON.stringify(stats));
  } catch {
    /* cache is a convenience */
  }
};

export function useProfileStats(user) {
  const uid = user?.$id || null;
  // Only the stable `subscribe` is used, never the changing cache object —
  // depending on the whole store would re-run the count query on every
  // month fetch.
  const { subscribe } = useShiftsStore();
  const [stats, setStats] = useState({ totalShifts: null, activeMonths: null });
  const cacheRef = useRef(null);
  const rescanTimer = useRef(null);

  useEffect(() => {
    if (!uid) return undefined;
    let cancelled = false;

    const publish = (c) => {
      cacheRef.current = c;
      if (!cancelled) {
        setStats({ totalShifts: c.total, activeMonths: c.months.length });
      }
    };

    const fullScan = async () => {
      const docs = await listAllDocuments(DATABASE_ID, SHIFTS_HISTORY, [
        Query.equal("user_id", uid),
        Query.orderAsc("$id"),
      ]);
      const c = statsFromDocs(docs);
      await writeCache(uid, c);
      publish(c);
    };

    (async () => {
      try {
        const [cached, countRes] = await Promise.all([
          readCache(uid),
          databases.listDocuments(DATABASE_ID, SHIFTS_HISTORY, [
            Query.equal("user_id", uid),
            Query.limit(1),
          ]),
        ]);
        if (cancelled) return;
        const total = Number(countRes?.total);
        if (
          cached &&
          !cached.dirty &&
          Array.isArray(cached.months) &&
          Number.isFinite(total) &&
          // Appwrite caps `total` at 5000; compare on the same scale.
          Math.min(cached.total, 5000) === total
        ) {
          publish(cached);
          return;
        }
        await fullScan();
      } catch (err) {
        if (!cancelled) {
          console.log("useProfileStats: failed", err?.message);
          setStats({ totalShifts: null, activeMonths: null });
        }
      }
    })();

    // Keep the cache current from the store's single realtime feed.
    // Events that arrive before the first publish() are dropped; a missed
    // create shows up as a count mismatch on the next mount and rescans.
    const unsubscribe = subscribe(({ kind, monthKey }) => {
      if (!cacheRef.current) return;
      const next = applyStatsEvent(cacheRef.current, kind, monthKey);
      publish(next);
      writeCache(uid, next);
      if (next.dirty) {
        if (rescanTimer.current) clearTimeout(rescanTimer.current);
        rescanTimer.current = setTimeout(() => {
          rescanTimer.current = null;
          fullScan().catch((e) =>
            console.log("useProfileStats: rescan failed", e?.message),
          );
        }, RESCAN_DEBOUNCE_MS);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
      if (rescanTimer.current) {
        clearTimeout(rescanTimer.current);
        rescanTimer.current = null;
      }
    };
  }, [uid, subscribe]);

  return stats;
}
