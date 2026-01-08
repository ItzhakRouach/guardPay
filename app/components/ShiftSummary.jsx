import { View, StyleSheet } from "react-native";
import { Text, Surface, useTheme } from "react-native-paper";

export default function ShiftSummary({ shiftSummary }) {
  const theme = useTheme();
  const styles = makeStyle(theme);

  return (
    <Surface style={styles.summaryBox} elevation={0}>
      <View style={styles.summaryRow}>
        <Text variant="bodyLarge">Total Duration:</Text>
        <Text variant="titleLarge" style={{ color: theme.colors.primary }}>
          {shiftSummary} Hours{" "}
        </Text>
      </View>
      {Number(shiftSummary) > 12 && (
        <Text style={styles.warningText}>
          ⚠️ Shifts longer than 12h require attention.
        </Text>
      )}
    </Surface>
  );
}

const makeStyle = (theme) =>
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
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    warningText: {
      color: theme.colors.error, // Red for warnings
      fontSize: 12,
      marginTop: 10,
      fontWeight: "500",
    },
  });
