import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Divider, Surface, Text, useTheme } from "react-native-paper";
import { useLanguage } from "../../hooks/lang-context";
import { formattedAmount } from "../../lib/utils";

export default function MonthSummary({
  bruto,
  totalShifts,
  totalRegHours,
  totalExtraHours,
  totalDeductions,
}) {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const theme = useTheme();
  const styles = makeStyle(theme, isRTL);

  return (
    <Surface elevation={1} style={styles.contentSurface}>
      <View style={styles.salaryContent}>
        <Text variant="bodyLarge" style={styles.field}>
          {t("overview.bruto")}
        </Text>
        <Text variant="bodyLarge" style={styles.income}>
          {formattedAmount(bruto)} ₪
        </Text>
      </View>
      <Divider style={styles.dividerStyle} bold={true} />
      <View style={styles.salaryContent}>
        <Text variant="bodyLarge" style={styles.field}>
          {t("overview.shift_t")}
        </Text>
        <Text variant="bodyLarge" style={styles.shiftsField}>
          {totalShifts}
        </Text>
      </View>
      <Divider style={styles.dividerStyle} bold={true} />
      <View style={styles.salaryContent}>
        <Text variant="bodyLarge" style={styles.field}>
          {t("overview.total_h")}
        </Text>
        <Text variant="bodyLarge" style={styles.shiftsField}>
          {totalRegHours + totalExtraHours} Hr
        </Text>
      </View>
      <Divider style={styles.dividerStyle} bold={true} />
      <View style={styles.salaryContent}>
        <Text variant="bodyLarge" style={styles.field}>
          {t("overview.total_d")}
        </Text>
        <Text variant="bodyLarge" style={styles.expense}>
          {formattedAmount(totalDeductions)} ₪
        </Text>
      </View>
    </Surface>
  );
}

const makeStyle = (theme, isRTL) =>
  StyleSheet.create({
    contentSurface: {
      marginTop: 50,
      height: 250,
      padding: 15,
      marginHorizontal: 10,
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
    },
    salaryContent: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingStart: 10,
      gap: 20,
      marginBottom: 10,
    },
    dividerStyle: {
      marginBottom: 25,
    },
    field: {
      fontWeight: "600",
      marginLeft: 10,
      color: theme.colors.primary,
    },
    shiftsField: {
      fontWeight: "bold",
      marginRight: 10,
    },
    income: {
      fontWeight: "bold",
      color: "#10B981",
      marginRight: 10,
    },
    expense: {
      fontWeight: "bold",
      color: "#F43F5E",
      marginRight: 10,
    },
  });
