import { useTranslation } from "react-i18next";
import { View, StyleSheet } from "react-native";
import { Text, Surface, useTheme } from "react-native-paper";
import { useLanguage } from "../../../lib/lang-context";

export default function ShiftSummary({ shiftSummary }) {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const theme = useTheme();
  const styles = makeStyle(theme, isRTL);
  return (
    <Surface style={styles.summaryBox} elevation={0}>
      <View style={styles.summaryRow}>
        <Text variant="bodyLarge">{t("add_shift.total_d")}</Text>
        <Text
          variant="titleLarge"
          style={{
            color: theme.colors.primary,
            writingDirection: isRTL ? "rtl" : "ltr",
          }}
        >
          {shiftSummary} {t("shifts.hours")}
        </Text>
      </View>
      {Number(shiftSummary) > 12 && (
        <Text style={styles.warningText}>{t("add_shift.err")}</Text>
      )}
    </Surface>
  );
}

const makeStyle = (theme, isRTL) =>
  StyleSheet.create({
    summaryBox: {
      backgroundColor: theme.colors.surface,
      padding: 20,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      marginBottom: 30,
    },
    summaryRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      alignItems: "center",
      textAlign: isRTL ? "right" : "left",
      writingDirection: isRTL ? "rtl" : "ltr",
    },
    warningText: {
      color: theme.colors.error, // Red for warnings
      fontSize: 13,
      marginTop: 10,
      paddingStart: 10,
      fontWeight: "500",
      writingDirection: isRTL ? "rtl" : "ltr",
      textAlign: isRTL ? "right" : "left",
    },
  });
