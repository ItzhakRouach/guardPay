import { useCallback, useEffect, useState } from "react";
import { Query } from "react-native-appwrite";
import {
  client,
  DATABASE_ID,
  databases,
  SHIFTS_HISTORY,
} from "../lib/appwrite";

export const useShift = (user, currentDate) => {
  const [loading, setLoading] = useState(false);
  const [shifts, setShifts] = useState([]);

  const fetchShifts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const startOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      ).toISOString();
      const endOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0,
        23,
        59,
        59
      ).toISOString();

      const response = await databases.listDocuments(
        DATABASE_ID,
        SHIFTS_HISTORY,
        [
          Query.equal("user_id", user.$id),
          Query.between("start_time", startOfMonth, endOfMonth),
          Query.orderAsc("start_time"),
        ]
      );
      setShifts(response.documents || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }, [user, currentDate]);

  useEffect(() => {
    fetchShifts();
    const channel = `databases.${DATABASE_ID}.collections.${SHIFTS_HISTORY}.documents`;
    const unsubscribe = client.subscribe(channel, (response) => {
      const isMyUser = response.payload.user_id === user.$id;
      const isDeleted = response.events.some((e) => e.includes(".delete"));

      // Check if the modified document belongs to the current user
      if (isMyUser || isDeleted) {
        fetchShifts();
      }
    });
    return () => unsubscribe();
  }, [fetchShifts, user]);

  return { setShifts, shifts, loading, refetch: fetchShifts };
};
