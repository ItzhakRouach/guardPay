import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Query } from "react-native-appwrite";
import { client, DATABASE_ID, SHIFTS_HISTORY } from "../lib/appwrite";
import { listAllDocuments } from "../lib/appwriteList";
import {
  eventKind,
  eventMonthKey,
  isMyEvent,
  monthRangeIso,
} from "../lib/shiftsCache";
import { useAuth } from "./auth-context";

// One store for shifts_history, shared by every screen.
//
// Before: Shifts, Overview and Paycheck each ran their own useShift, each
// with its own month fetch and its own realtime subscription to the whole
// collection, each refetching the full month on ANY event. Three mounted
// screens × N documents in a bulk sick entry = 3N full-month fetches.
//
// Now: months are cached here by "YYYY-M" key; a fetch for a month is
// deduplicated while in flight; there is exactly one realtime subscription
// per signed-in user, filtered to that user's documents; an event refreshes
// only the month it belongs to, and events are coalesced for 400 ms so a
// 14-day range entry produces one refetch, not fourteen.

const ShiftsContext = createContext(null);
const EMPTY = Object.freeze([]);
const COALESCE_MS = 400;
const STALE_MS = 60 * 1000;

export function ShiftsProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.$id || null;

  // key -> { docs, loading, error, loadedAt }
  const [months, setMonths] = useState({});
  const inflight = useRef(new Map()); // key -> Promise
  const seq = useRef(new Map()); // key -> latest request token
  const retained = useRef(new Map()); // key -> refcount (mounted screens)
  const listeners = useRef(new Set()); // realtime observers (stats hook)
  const pendingKeys = useRef(new Set());
  const coalesceTimer = useRef(null);

  // New user (or sign-out): drop everything — synchronously during render,
  // because child effects (a mounted useShift kicking off a fetch) run
  // BEFORE a parent effect would, and a wipe after that would strand the
  // child with loading=true forever.
  const [lastUserId, setLastUserId] = useState(userId);
  if (lastUserId !== userId) {
    setLastUserId(userId);
    setMonths({});
    inflight.current.clear();
    seq.current.clear();
    pendingKeys.current.clear();
  }

  const fetchMonth = useCallback(
    (key, { force = false } = {}) => {
      if (!userId) return Promise.resolve(EMPTY);
      // Dedupe while in flight — unless the caller just mutated data and
      // needs a request that started AFTER the mutation.
      const existing = inflight.current.get(key);
      if (existing && !force) return existing;

      const [y, m] = key.split("-").map(Number);
      const { start, end } = monthRangeIso(y, m);
      const token = (seq.current.get(key) || 0) + 1;
      seq.current.set(key, token);

      setMonths((prev) => ({
        ...prev,
        [key]: { docs: EMPTY, loadedAt: null, ...prev[key], loading: true },
      }));

      const p = listAllDocuments(DATABASE_ID, SHIFTS_HISTORY, [
        Query.equal("user_id", userId),
        Query.between("start_time", start, end),
        Query.orderAsc("start_time"),
      ])
        .then((docs) => {
          if (seq.current.get(key) !== token) return docs; // superseded
          setMonths((prev) => ({
            ...prev,
            [key]: { docs, loading: false, error: null, loadedAt: Date.now() },
          }));
          return docs;
        })
        .catch((err) => {
          if (seq.current.get(key) !== token) return EMPTY;
          console.log(`[shifts] fetch ${key} failed:`, err?.message);
          // Keep last-known docs; expose the error (see Phase 1 outage UX).
          setMonths((prev) => ({
            ...prev,
            [key]: {
              docs: EMPTY,
              loadedAt: null,
              ...prev[key],
              loading: false,
              error: err,
            },
          }));
          return EMPTY;
        })
        .finally(() => {
          if (inflight.current.get(key) === p) inflight.current.delete(key);
        });
      inflight.current.set(key, p);
      return p;
    },
    [userId],
  );

  const flushPending = useCallback(() => {
    coalesceTimer.current = null;
    const keys = [...pendingKeys.current];
    pendingKeys.current.clear();
    keys.forEach((k) => fetchMonth(k));
  }, [fetchMonth]);

  const scheduleRefetch = useCallback(
    (key) => {
      pendingKeys.current.add(key);
      if (coalesceTimer.current) return;
      coalesceTimer.current = setTimeout(flushPending, COALESCE_MS);
    },
    [flushPending],
  );

  // A ref mirror of `months` so the subscription callback can read the
  // latest cache without re-subscribing on every change.
  const monthsRef = useRef(months);
  useEffect(() => {
    monthsRef.current = months;
  }, [months]);

  // The single realtime subscription per user.
  useEffect(() => {
    if (!userId) return undefined;
    const channel = `databases.${DATABASE_ID}.collections.${SHIFTS_HISTORY}.documents`;
    let unsubscribe = () => {};
    try {
      unsubscribe = client.subscribe(channel, (response) => {
        const kind = eventKind(response);
        const payload = response?.payload || {};
        const mine = isMyEvent(response, userId);
        // Delete payloads normally carry the document; if user_id is
        // missing, fall back to "is this id in one of my loaded months".
        const ownsById =
          !mine &&
          kind === "delete" &&
          !!payload.$id &&
          monthsRef.current &&
          Object.values(monthsRef.current).some((m) =>
            (m.docs || []).some((d) => d.$id === payload.$id),
          );
        if (!mine && !ownsById) return;

        const key = eventMonthKey(response);
        listeners.current.forEach((fn) => {
          try {
            fn({ kind, monthKey: key, payload });
          } catch (e) {
            console.log("[shifts] listener failed:", e?.message);
          }
        });
        const isRetained = (k) => (retained.current.get(k) || 0) > 0;
        // Drop a cached month nobody is looking at, so the next visit fetches
        // fresh instead of serving a < 60 s-old copy that misses this event.
        const invalidate = (k) =>
          setMonths((prev) => {
            if (!(k in prev)) return prev;
            const next = { ...prev };
            delete next[k];
            return next;
          });

        if (key) {
          if (isRetained(key)) scheduleRefetch(key);
          else invalidate(key);
        } else if (ownsById) {
          // Unknown month for a delete: refresh what's on screen, forget
          // the rest.
          Object.keys(monthsRef.current || {}).forEach((k) => {
            if (isRetained(k)) scheduleRefetch(k);
            else invalidate(k);
          });
        }
      });
    } catch (e) {
      console.log("[shifts] subscribe failed:", e?.message);
    }
    return () => {
      try {
        unsubscribe();
      } catch {
        /* already closed */
      }
      if (coalesceTimer.current) {
        clearTimeout(coalesceTimer.current);
        coalesceTimer.current = null;
      }
    };
  }, [userId, scheduleRefetch]);

  const retain = useCallback((key) => {
    retained.current.set(key, (retained.current.get(key) || 0) + 1);
  }, []);
  const release = useCallback((key) => {
    const n = (retained.current.get(key) || 1) - 1;
    if (n <= 0) retained.current.delete(key);
    else retained.current.set(key, n);
  }, []);

  const patchMonth = useCallback((key, updater) => {
    setMonths((prev) => {
      const entry = prev[key] || {
        docs: EMPTY,
        loading: false,
        error: null,
        loadedAt: null,
      };
      const docs =
        typeof updater === "function" ? updater(entry.docs) : updater;
      return { ...prev, [key]: { ...entry, docs } };
    });
  }, []);

  const subscribe = useCallback((fn) => {
    listeners.current.add(fn);
    return () => listeners.current.delete(fn);
  }, []);

  const value = useMemo(
    () => ({
      months,
      fetchMonth,
      retain,
      release,
      patchMonth,
      subscribe,
      userId,
    }),
    [months, fetchMonth, retain, release, patchMonth, subscribe, userId],
  );

  return (
    <ShiftsContext.Provider value={value}>{children}</ShiftsContext.Provider>
  );
}

export function useShiftsStore() {
  const ctx = useContext(ShiftsContext);
  if (!ctx) throw new Error("useShiftsStore must be inside ShiftsProvider.");
  return ctx;
}

/**
 * Same signature and return shape as before ({ shifts, loading, error,
 * refetch, setShifts }), now backed by the shared store. `user` is kept
 * for compatibility; the store already knows the signed-in user.
 */
export function useShift(user, currentDate) {
  const store = useShiftsStore();
  const { retain, release, fetchMonth, patchMonth, userId } = store;
  const key = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
  const entry = store.months[key];

  useEffect(() => {
    retain(key);
    return () => release(key);
  }, [retain, release, key]);

  // Fetch when unknown or previously failed; revalidate quietly when older
  // than STALE_MS. (`store.months` is read, not depended on, on purpose:
  // this decides on mount / month switch, not on every cache change.)
  useEffect(() => {
    if (!userId || !user) return;
    const e = store.months[key];
    const needsFetch =
      !e ||
      (!e.loading &&
        (e.error || !e.loadedAt || Date.now() - e.loadedAt > STALE_MS));
    if (needsFetch) fetchMonth(key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, user?.$id, key, fetchMonth]);

  const refetch = useCallback(
    () => fetchMonth(key, { force: true }),
    [fetchMonth, key],
  );
  const setShifts = useCallback(
    (updater) => patchMonth(key, updater),
    [patchMonth, key],
  );

  const shifts = entry?.docs || EMPTY;
  // "Loading" only while we have nothing to show for this month yet — a
  // background revalidation of a cached month keeps showing the data.
  const loading = !userId
    ? false
    : !entry || (entry.loading && !entry.loadedAt);
  const error = entry?.error || null;

  return { shifts, loading, error, refetch, setShifts };
}
