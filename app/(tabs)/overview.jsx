import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, useTheme } from "react-native-paper";
import { useAuth } from "../../lib/auth-context";
import { handleGeneratePDF } from "../../lib/GeneratePaycheck";
import { calculateSalary } from "../../lib/salary_calculation";
import { useShift } from "../../lib/useShift";
import LoadingSpinner from "../components/common/LoadingSpinnner";
import MonthPicker from "../components/layout/MonthPicker";
import MonthNetoCard from "../components/overview/MonthNetoCard";
import MonthSummary from "../components/overview/MonthSummary";

export default function OverViewScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { user, profile } = useAuth();
  const { shifts, loading } = useShift(user, currentDate);

  const totals = useMemo(() => {
    // Calculate Hour Totals
    const h100 = shifts.reduce((sum, s) => sum + Number(s.h100_hours || 0), 0);
    const h150s = shifts.reduce(
      (sum, s) => sum + Number(s.h150_shabat || 0),
      0
    );
    const h125e = shifts.reduce(
      (sum, s) => sum + Number(s.h125_extra_hours || 0),
      0
    );
    const h150e = shifts.reduce(
      (sum, s) => sum + Number(s.h150_extra_hours || 0),
      0
    );
    const h175s = shifts.reduce(
      (sum, s) => sum + Number(s.h175_extra_hours || 0),
      0
    );
    const h200s = shifts.reduce(
      (sum, s) => sum + Number(s.h200_extra_hours || 0),
      0
    );

    // 4. Existing Pay summaries
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
    const travelCount = shifts.filter(
      (s) => Number(s.travel_pay_amount) > 0
    ).length;

    const trainingAmount = shifts.reduce((sum, s) => {
      if (s.is_training) {
        return sum + s.total_amount || 0;
      }
      return sum;
    }, 0);

    const vacationAmount = shifts.reduce((sum, s) => {
      if (s.is_vacation) {
        return sum + s.total_amount || 0;
      }
      return sum;
    }, 0);

    const vacationDays = shifts.filter((s) => s.is_vacation === true).length;

    const trainingDays = shifts.filter((s) => s.is_training === true).length;

    const totalShifts = shifts.length - vacationDays;

    // 5. Final Calculations
    const totalHours = h100 + h125e + h150e + h150s + h175s + h200s;
    const monthlyReport = calculateSalary(
      regPay,
      extraPay,
      travelPay,
      trainingAmount,
      vacationAmount
    );

    return {
      monthlyTravelPay: travelPay,
      monthlyReport: monthlyReport,
      totalReg: h100 + h150s,
      totalExtra: h125e + h150e + h175s + h200s,
      totalHours,
      travelCount,
      trainingDays,
      trainingAmount,
      vacationDays,
      vacationAmount,
      totalShifts,
    };
  }, [shifts]);

  // intilize styles
  const theme = useTheme();
  const styles = makeStyle(theme);

  return (
    <View style={styles.container}>
      <MonthPicker currentDate={currentDate} setCurrentDate={setCurrentDate} />
      {loading && <LoadingSpinner />}

      <MonthSummary
        bruto={totals.monthlyReport.bruto}
        totalShifts={totals.totalShifts}
        totalRegHours={totals.totalReg}
        totalExtraHours={totals.totalExtra}
        totalDeductions={totals.monthlyReport.totalDeductions}
      />
      <MonthNetoCard neto={totals.monthlyReport.neto} />
      <Button
        icon="receipt-text-check"
        style={styles.btn}
        labelStyle={styles.btnLabel}
        contentStyle={styles.btnContent}
        onPress={() => handleGeneratePDF(totals, profile, currentDate, shifts)}
        mode="contained"
      >
        Generate Paycheck
      </Button>
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

    btn: {
      marginTop: "auto",
      marginBottom: "auto",
      borderRadius: 20,
      width: "100%",
      alignSelf: "center",
      backgroundColor: theme.colors.primary,
      elevation: 5,
    },
    btnContent: {
      paddingVertical: 15,
      flexDirection: "row-reverse",
    },
    btnLabel: {
      fontSize: 18,
      fontWeight: "bold",
    },
  });
