import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Button, useTheme } from "react-native-paper";
import LoadingSpinner from "../../components/common/LoadingSpinnner";
import MonthPicker from "../../components/layout/MonthPicker";
import MonthNetoCard from "../../components/overview/MonthNetoCard";
import MonthSummary from "../../components/overview/MonthSummary";
import { useAuth } from "../../hooks/auth-context";
import { useLanguage } from "../../hooks/lang-context";
import { useMonthlySalary } from "../../hooks/useMonthlySalary";
import { useShift } from "../../hooks/useShift";
import { handleGeneratePDF } from "../../lib/GeneratePaycheck";

export default function OverViewScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { user, profile } = useAuth();
  const { shifts, loading } = useShift(user, currentDate);
  const { monthlyReport, totals } = useMonthlySalary(shifts);

  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  // intilize styles
  const theme = useTheme();
  const styles = makeStyle(theme, isRTL);

  return (
    <View style={styles.container}>
      {monthlyReport ? (
        <>
          <MonthPicker
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
          />
          <MonthSummary
            bruto={monthlyReport.bruto}
            totalShifts={totals.totalShifts}
            totalRegHours={totals.totalReg}
            totalExtraHours={totals.totalExtra}
            totalDeductions={monthlyReport.totalDeductions}
          />
          <MonthNetoCard neto={monthlyReport.neto} />
          <Button
            icon="receipt-text-check"
            style={styles.btn}
            labelStyle={styles.btnLabel}
            contentStyle={styles.btnContent}
            onPress={() =>
              handleGeneratePDF(
                totals,
                profile,
                currentDate,
                shifts,
                monthlyReport
              )
            }
            mode="contained"
          >
            {t("overview.btn")}
          </Button>
        </>
      ) : (
        <LoadingSpinner />
      )}
    </View>
  );
}

const makeStyle = (theme, isRTL) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: 10,
      background: theme.colors.background,
    },

    btn: {
      marginTop: 40,
      marginBottom: 10,
      borderRadius: 20,
      width: "95%",
      alignSelf: "center",
      backgroundColor: theme.colors.primary,
      elevation: 3,
    },
    btnContent: {
      paddingVertical: 15,
      flexDirection: isRTL ? "row" : "row-reverse",
    },
    btnLabel: {
      fontSize: 18,
      fontWeight: "bold",
    },
  });
