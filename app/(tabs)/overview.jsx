import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import { useAuth } from "../../lib/auth-context";
import { calculateSalary } from "../../lib/salary_calculation";
import { useShift } from "../../lib/useShift";
import LoadingSpinner from "../components/LoadingSpinnner";
import MonthNetoCard from "../components/MonthNetoCard";
import MonthPicker from "../components/MonthPicker";
import MonthSummary from "../components/MonthSummary";

export default function OverViewScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { user } = useAuth();
  const { shifts, loading } = useShift(user, currentDate);

  const totals = useMemo(() => {
    const regPay = shifts.reduce(
      (sum, s) => sum + Number(s.reg_pay_amount || 0),
      0
    );
    const extraPay = shifts.reduce(
      (sum, s) => sum + Number(s.extra_pay_amount || 0),
      0
    );
    const travelPay = shifts.reduce(
      (sum, s) => sum + Number(s.travel_pay_amount || 0),
      0
    );
    const reg = shifts.reduce((sum, s) => sum + Number(s.reg_hours || 0), 0);
    const extra = shifts.reduce(
      (sum, s) => sum + Number(s.extra_hours || 0),
      0
    );
    const monthyReport = calculateSalary(regPay, extraPay, travelPay);

    return {
      monthlyRegPay: regPay,
      monthlyExtraPay: extraPay,
      monthlyTravelPay: travelPay,
      monthlyReport: monthyReport,
      totalReg: reg,
      totalExtra: extra,
    };
  }, [shifts]);

  const totalShift = useMemo(() => {
    return Array.isArray(shifts) ? shifts.length : 0;
  }, [shifts]);

  // run each time the month is changed , to fetch the shifs from that month

  // intilize styles
  const theme = useTheme();
  const styles = makeStyle(theme);

  return (
    <View style={styles.container}>
      <MonthPicker currentDate={currentDate} setCurrentDate={setCurrentDate} />
      {loading && <LoadingSpinner />}
      <MonthSummary
        bruto={totals.monthlyReport.bruto}
        totalShifts={totalShift}
        totalRegHours={totals.totalReg}
        totalExtraHours={totals.totalExtra}
        monthTravelMoney={totals.monthlyTravelPay}
        monthRegPay={totals.monthlyRegPay}
        monthExtraPay={totals.monthlyExtraPay}
        pensia={totals.monthlyReport.pensia}
        bituahLeumi={totals.monthlyReport.bituahLeumiAndHealth}
        incomeTax={totals.monthlyReport.incomeTax}
        totalDeductions={totals.monthlyReport.totalDeductions}
      />
      <MonthNetoCard neto={totals.monthlyReport.neto} />
    </View>
  );
}

const makeStyle = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: 10,
      background: theme.colors.background,
    },
  });
