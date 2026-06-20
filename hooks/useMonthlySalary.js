import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../hooks/auth-context"; // וודא שהנתיב נכון
import { calculateSalary } from "../lib/salaryLogic";
import { readSalaryCache, writeSalaryCache } from "../lib/salaryCache";

// Stale-while-revalidate: when the hook mounts (or the user/month
// changes), we first paint the cached salary report so the bruto / neto
// figures show up instantly. The salary is then recomputed locally (via
// calculateSalary — formerly the CALCULATE_SALARY cloud function) and
// overwrites the cached value with the fresh result.
//
// `monthlyReport` stays `null` until either the cache hits or the local
// compute runs — never set to zeros prematurely. `salaryLoading` flips
// false only once the compute has run or taken the empty-month shortcut.
// Consumers render a spinner when monthlyReport is null AND
// salaryLoading is true.
//
// `currentDate` + `shiftsLoading` are optional for backwards compat —
// callers that don't pass them get the old non-cached behavior with
// the new spinner-friendly state shape.
export const useMonthlySalary = (shifts, currentDate, shiftsLoading = false) => {
  const { user, profile } = useAuth();
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [salaryLoading, setSalaryLoading] = useState(true);

  const cacheYear = currentDate ? currentDate.getFullYear() : null;
  const cacheMonth = currentDate ? currentDate.getMonth() : null;
  const userId = user?.$id;

  // When the cache key changes (different user or month), drop the
  // previous month's report SYNCHRONOUSLY during render so the very
  // first paint after a month switch shows the spinner instead of
  // flashing the previous month's neto. Deferring this to useEffect
  // (the previous behaviour) caused a one-frame stale value.
  const currentKey = `${userId || ""}:${cacheYear}-${cacheMonth}`;
  const [lastKey, setLastKey] = useState(currentKey);
  if (lastKey !== currentKey) {
    setLastKey(currentKey);
    setMonthlyReport(null);
    setSalaryLoading(true);
  }

  // Hydrate from cache. Seeds with the new month's cached value if one
  // exists, using a functional update so it can't overwrite a fresher
  // cloud-function result that arrived first.
  useEffect(() => {
    if (!userId || cacheYear == null || cacheMonth == null) return;
    let cancelled = false;
    (async () => {
      const cached = await readSalaryCache(userId, cacheYear, cacheMonth);
      if (cancelled || !cached) return;
      setMonthlyReport((prev) => prev ?? cached);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, cacheYear, cacheMonth]);

  const totals = useMemo(() => {
    const initial = {
      h100: 0,
      h150s: 0,
      h125e: 0,
      h150e: 0,
      h175s: 0,
      h200s: 0,
      regPay: 0,
      extraPay: 0,
      travelPay: 0,
      travelCount: 0,
      trainingAmount: 0,
      trainingDays: 0,
      vacationAmount: 0,
      vacationDays: 0,
      sickAmount: 0,
      sickDays: 0,
    };

    return shifts.reduce((acc, s) => {
      acc.h100 += Number(s.h100_hours || 0);
      acc.h150s += Number(s.h150_shabat || 0);
      acc.h125e += Number(s.h125_extra_hours || 0);
      acc.h150e += Number(s.h150_extra_hours || 0);
      acc.h175s += Number(s.h175_extra_hours || 0);
      acc.h200s += Number(s.h200_extra_hours || 0);

      if (s.is_training) {
        acc.trainingAmount += Number(s.total_amount || 0);
        acc.trainingDays++;
      } else if (s.is_vacation) {
        acc.vacationAmount += Number(s.total_amount || 0);
        acc.vacationDays++;
      } else if (s.is_sick) {
        // Sick-day pay is precomputed client-side by buildSickDocs /
        // restreakSickDocs (utils/sickDays.js) using Israeli sick-leave
        // law (0% / 50% / 50% / 100%+). Sent to the cloud function as
        // sick_pay so bruto and pensia are correct.
        acc.sickAmount += Number(s.total_amount || 0);
        acc.sickDays++;
      } else {
        // Only count regular/extra/travel pay for non-training, non-vacation
        // shifts. Training/vacation are sent to the cloud function under
        // their own keys (training_pay/vacation_pay) and would otherwise be
        // double-counted into bruto.
        acc.regPay += Number(s.reg_pay_amount || 0);
        acc.extraPay += Number(s.extra_pay_amount || 0);
        acc.travelPay += Number(s.travel_pay_amount || 0);
        if (Number(s.travel_pay_amount) > 0) acc.travelCount++;
      }
      return acc;
    }, initial);
  }, [shifts]);

  const totalHours =
    totals.h100 +
    totals.h125e +
    totals.h150e +
    totals.h150s +
    totals.h175s +
    totals.h200s;
  const totalReg = totals.h100 + totals.h150s;
  const totalExtra = totals.h125e + totals.h150e + totals.h175s + totals.h200s;
  const totalShifts = shifts.length - totals.vacationDays - totals.sickDays;

  useEffect(() => {
    // Don't decide anything while the shift list is still being
    // fetched — empty-array-during-load would falsely look like a
    // zero-bruto month and clobber a cached value.
    if (shiftsLoading) return;

    // Cancellation guard: if the deps change (month switch, shifts
    // arrive) before this execution resolves, the in-flight call must
    // NOT write its result. Without this, a stale execution started
    // with the previous month's totals can resolve after the new
    // month's empty-shortcut zeros land and overwrite them — which is
    // why an empty new month used to display the previous month's neto
    // until a real shift was added.
    let cancelled = false;

    const getSalary = async () => {
      if (shifts.length === 0 || !userId) {
        if (cancelled) return;
        const empty = { bruto: 0, neto: 0, totalDeductions: 0 };
        setMonthlyReport(empty);
        setSalaryLoading(false);
        // Cache zeros too — re-opening a known-empty month shouldn't
        // flash a stale non-zero value from a previous fill.
        if (cacheYear != null && cacheMonth != null) {
          writeSalaryCache(userId, cacheYear, cacheMonth, empty);
        }
        return;
      }
      try {
        // Computed locally (was the CALCULATE_SALARY cloud function).
        // Settlement / credit-point inputs come from the profile — the same
        // fields the cloud function used to read from users_prefs, with the
        // same defaults — so the result is identical, just without the
        // (flaky) network round-trip.
        const result = calculateSalary(
          totals.regPay,
          totals.extraPay,
          totals.travelPay,
          totals.trainingAmount,
          totals.vacationAmount,
          profile?.credit_points || 2.25,
          profile?.settlement_percent || 0,
          profile?.settlement_annual_cap || 0,
          totals.sickAmount,
        );
        if (cancelled) return;
        setMonthlyReport(result);
        if (cacheYear != null && cacheMonth != null) {
          writeSalaryCache(userId, cacheYear, cacheMonth, result);
        }
      } finally {
        if (!cancelled) setSalaryLoading(false);
      }
    };

    getSalary();
    return () => {
      cancelled = true;
    };
  }, [
    totals,
    shifts.length,
    userId,
    cacheYear,
    cacheMonth,
    shiftsLoading,
    profile?.credit_points,
    profile?.settlement_percent,
    profile?.settlement_annual_cap,
  ]);

  return {
    monthlyReport,
    salaryLoading,
    totals: { ...totals, totalHours, totalReg, totalExtra, totalShifts },
  };
};
