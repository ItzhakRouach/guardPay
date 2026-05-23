import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../hooks/auth-context"; // וודא שהנתיב נכון
import { functions } from "../lib/appwrite";
import { readSalaryCache, writeSalaryCache } from "../lib/salaryCache";

// Stale-while-revalidate: when the hook mounts (or the user/month
// changes), we first paint the cached salary report so the bruto / neto
// figures show up instantly. The cloud function call then runs in the
// background and overwrites the cached value with the fresh result.
//
// Without this, every navigation to Shifts / Overview / Paycheck flashed
// "0 ₪" for the second the CALCULATE_SALARY function took to respond.
//
// `currentDate` is optional for backwards compat — callers that don't
// pass it skip the cache layer entirely.
export const useMonthlySalary = (shifts, currentDate) => {
  const { user } = useAuth();
  const [monthlyReport, setMonthlyReport] = useState(null);

  // Cache slot key derived from currentDate. Stable per-month so flips
  // between months don't mix data.
  const cacheYear = currentDate ? currentDate.getFullYear() : null;
  const cacheMonth = currentDate ? currentDate.getMonth() : null;
  const userId = user?.$id;

  // Hydrate state from AsyncStorage on first mount + whenever the
  // cache key changes. `cancelled` guard avoids racing writes if the
  // user flips months mid-fetch.
  useEffect(() => {
    if (!userId || cacheYear == null || cacheMonth == null) return;
    let cancelled = false;
    (async () => {
      const cached = await readSalaryCache(userId, cacheYear, cacheMonth);
      if (cancelled || !cached) return;
      // Don't clobber a fresher cloud-function result that arrived
      // first — only seed if state is still null.
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
    const getSalary = async () => {
      if (shifts.length === 0 || !userId) {
        const empty = { bruto: 0, neto: 0, totalDeductions: 0 };
        setMonthlyReport(empty);
        // Cache the empty result too — re-opening a known-empty month
        // shouldn't flash a stale non-zero value from a previous fill.
        if (cacheYear != null && cacheMonth != null) {
          writeSalaryCache(userId, cacheYear, cacheMonth, empty);
        }
        return;
      }
      try {
        const execution = await functions.createExecution(
          "697d0f3c001bba7f03d2",
          JSON.stringify({
            action: "CALCULATE_SALARY",
            payload: {
              regularPay: totals.regPay,
              extraPay: totals.extraPay,
              travelPay: totals.travelPay,
              vacation_pay: totals.vacationAmount,
              training_pay: totals.trainingAmount,
              sick_pay: totals.sickAmount,
              user_id: userId,
            },
          }),
        );
        const result = JSON.parse(execution.responseBody);
        setMonthlyReport(result);
        if (cacheYear != null && cacheMonth != null) {
          writeSalaryCache(userId, cacheYear, cacheMonth, result);
        }
      } catch (e) {
        console.error("Cloud Error:", e);
      }
    };

    getSalary();
  }, [totals, shifts.length, userId, cacheYear, cacheMonth]);

  return {
    monthlyReport,
    totals: { ...totals, totalHours, totalReg, totalExtra, totalShifts },
  };
};
