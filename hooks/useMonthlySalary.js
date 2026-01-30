import { useEffect, useMemo, useState } from "react";
import { functions } from "../lib/appwrite";

export const useMonthlySalary = (shifts) => {
  const [monthlyReport, setMonthlyReport] = useState(null);

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
    };

    return shifts.reduce((acc, s) => {
      acc.h100 += Number(s.h100_hours || 0);
      acc.h150s += Number(s.h150_shabat || 0);
      acc.h125e += Number(s.h125_extra_hours || 0);
      acc.h150e += Number(s.h150_extra_hours || 0);
      acc.h175s += Number(s.h175_extra_hours || 0);
      acc.h200s += Number(s.h200_extra_hours || 0);
      acc.regPay += Number(s.reg_pay_amount || 0);
      acc.extraPay += Number(s.extra_pay_amount || 0);
      acc.travelPay += Number(s.travel_pay_amount || 0);

      if (Number(s.travel_pay_amount) > 0) acc.travelCount++;
      if (s.is_training) {
        acc.trainingAmount += s.total_amount || 0;
        acc.trainingDays++;
      }
      if (s.is_vacation) {
        acc.vacationAmount += s.total_amount || 0;
        acc.vacationDays++;
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
  const totalShifts = shifts.length - totals.vacationDays;

  useEffect(() => {
    const getSalary = async () => {
      if (shifts.length === 0) {
        setMonthlyReport({ bruto: 0, neto: 0, totalDeductions: 0 });
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
            },
          }),
        );
        const result = JSON.parse(execution.responseBody);
        setMonthlyReport(result);
      } catch (e) {
        console.error("Cloud Error:", e);
      }
    };

    getSalary();
  }, [totals, shifts.length]);

  return {
    monthlyReport,
    totals: { ...totals, totalHours, totalReg, totalExtra, totalShifts },
  };
};
