import { useCallback, useMemo, useState } from "react";

// Shared month-stepper logic. Used by Overview / Shifts / Paycheck so all
// three headers stay in lockstep on chevron taps.
export function useMonthNav(initial = new Date()) {
  const [currentDate, setCurrentDate] = useState(initial);

  const prev = useCallback(() => {
    setCurrentDate((d) => {
      const next = new Date(d);
      next.setMonth(next.getMonth() - 1);
      return next;
    });
  }, []);

  const next = useCallback(() => {
    setCurrentDate((d) => {
      const n = new Date(d);
      n.setMonth(n.getMonth() + 1);
      return n;
    });
  }, []);

  return { currentDate, setCurrentDate, prev, next };
}

// Format the month + year for the header. Returns the month name in the
// active language and the year as a string (rendered separately so the
// year can be italicized).
export function formatMonth(date, locale) {
  const month = date.toLocaleDateString(locale, { month: "long" });
  const year = String(date.getFullYear());
  return { month, year };
}
