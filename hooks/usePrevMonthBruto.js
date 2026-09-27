import { useMemo } from "react";
import { docBruto } from "../lib/monthlyTotals";
import { useShift } from "./shifts-store";

// Previous month's bruto for the Overview trend chip. Reads the previous
// month through the shared shifts store, so it's cached and kept fresh by
// the same single realtime subscription — no private fetch any more.
// Returns null until loaded (or when the fetch failed), so the chip hides
// rather than showing a misleading 0.
export function usePrevMonthBruto(user, currentDate) {
  const prevMonth = useMemo(
    () => new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    [currentDate],
  );
  const { shifts, loading, error } = useShift(user, prevMonth);
  return useMemo(() => {
    if (loading) return null;
    if (error && shifts.length === 0) return null;
    return shifts.reduce((a, s) => a + docBruto(s), 0);
  }, [shifts, loading, error]);
}
