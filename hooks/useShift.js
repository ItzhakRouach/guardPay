import { useCallback, useEffect, useState } from "react";
import { Query } from "react-native-appwrite";
import {
  client,
  DATABASE_ID,
  databases,
  SHIFTS_HISTORY,
} from "../lib/appwrite";

export const useShift = (user, currentDate) => {
  // Default `loading: true` so the first render accurately reflects
  // "we haven't fetched yet". The previous initial value of false
  // created a one-frame window where consumers saw shifts=[] AND
  // loading=false — useMonthlySalary used that window to write
  // {bruto:0, neto:0} to its cache, flashing zeros to the user
  // before the real fetch even started.
  const [loading, setLoading] = useState(true);
  const [shifts, setShifts] = useState([]);

  // When `currentDate` changes, synchronously drop the previous
  // month's shifts and flip loading back on during render. Otherwise
  // consumers (notably useMonthlySalary) get one render with the new
  // currentDate but the OLD shifts array + stale `loading: false`,
  // which used to trigger a CALCULATE_SALARY call against the previous
  // month's totals and write the result into the new month's cache.
  const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
  const [lastMonthKey, setLastMonthKey] = useState(monthKey);
  if (lastMonthKey !== monthKey) {
    setLastMonthKey(monthKey);
    setShifts([]);
    setLoading(true);
  }

  const fetchShifts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const startOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1,
      ).toISOString();
      const endOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0,
        23,
        59,
        59,
      ).toISOString();

      const response = await databases.listDocuments(
        DATABASE_ID,
        SHIFTS_HISTORY,
        [
          Query.equal("user_id", user.$id),
          Query.between("start_time", startOfMonth, endOfMonth),
          Query.orderAsc("start_time"),
          Query.limit(60),
        ],
      );
      setShifts(response.documents || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }, [user, currentDate]);

  useEffect(() => {
    if (!user) {
      // No user signed in — nothing to fetch, drop the initial-true
      // loading state so consumers don't spin forever (the RouteGuard
      // sends unauthed users away from these screens anyway, but be
      // defensive).
      setLoading(false);
      return;
    }
    fetchShifts();
    const channel = `databases.${DATABASE_ID}.collections.${SHIFTS_HISTORY}.documents`;
    const unsubscribe = client.subscribe(channel, (response) => {
      // The subscription can fire once more during sign-out teardown after
      // `user` has been cleared — guard before reading $id.
      if (!user) return;
      const isMyUser = response.payload?.user_id === user.$id;
      const isDeleted = response.events.some((e) => e.includes(".delete"));
      if (isMyUser || isDeleted) {
        fetchShifts();
      }
    });
    return () => unsubscribe();
  }, [fetchShifts, user]);

  return { setShifts, shifts, loading, refetch: fetchShifts };
};
