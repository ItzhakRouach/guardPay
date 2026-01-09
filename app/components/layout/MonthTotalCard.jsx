import { StyleSheet, View } from "react-native";
import { Divider, Surface, Text, useTheme } from "react-native-paper";
import { formattedAmount } from "../../../lib/utils";

export default function MonthTotalCard({ totalAmount, totalHours }) {
  const theme = useTheme();
  const styles = makeStyle(theme);
  return (
    <Surface style={styles.summaryBar} elevation={1}>
      <View>
        <Text variant="labelMedium" style={styles.summaryLabel}>
          MONTHLY PAY
        </Text>
        <Text variant="titleLarge" style={styles.summaryValue}>
          {formattedAmount(totalAmount)}₪
        </Text>
      </View>

      <Divider style={styles.verticalDivider} />
      <View>
        <Text variant="labelMedium" style={styles.summaryLabel}>
          TOTAL HOURS
        </Text>
        <Text variant="titleLarge" style={styles.summaryValue}>
          {totalHours.toFixed(1)}h
        </Text>
      </View>
    </Surface>
  );
}

const makeStyle = (theme) =>
  StyleSheet.create({
    summaryBar: {
      flexDirection: "row",
      backgroundColor: theme.colors.primary, // Dark theme for contrast
      marginHorizontal: 16,
      marginTop: 10, // Pulls it slightly closer to the header
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "space-around",
    },
    summaryLabel: {
      color: theme.colors.summary, // Light gray/blue
      letterSpacing: 1,
      fontWeight: 600,
      marginBottom: 4,
    },
    summaryValue: {
      color: theme.colors.surface, // White text stands out on dark background
      fontWeight: "bold",
      textAlign: "center",
    },
    verticalDivider: {
      width: 1,
      height: 30,
      backgroundColor: "rgba(255,255,255,0.2)", // Semi-transparent white
    },
  });
