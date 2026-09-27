import { useEffect, useState } from "react";
import { Query } from "react-native-appwrite";
import { DATABASE_ID, SHIFTS_HISTORY } from "../lib/appwrite";
import { listAllDocuments } from "../lib/appwriteList";
import { docBruto } from "../lib/monthlyTotals";

// Fetches the previous month's shifts and sums total_amount locally so the
// Overview header can show a trend percentage without paying for another
// CALCULATE_SALARY cloud invocation. Bruto-on-bruto comparison — close
// enough for the overview chip.
export function usePrevMonthBruto(user, currentDate) {
  const [bruto, setBruto] = useState(null);

  useEffect(() => {
    if (!user?.$id) return;
    let cancelled = false;

    (async () => {
      try {
        const start = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - 1,
          1,
        ).toISOString();
        const end = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          0,
          23,
          59,
          59,
        ).toISOString();
        const documents = await listAllDocuments(DATABASE_ID, SHIFTS_HISTORY, [
          Query.equal("user_id", user.$id),
          Query.between("start_time", start, end),
        ]);
        if (cancelled) return;
        const sum = documents.reduce((a, s) => a + docBruto(s), 0);
        setBruto(sum);
      } catch {
        if (!cancelled) setBruto(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.$id, currentDate]);

  return bruto;
}
