import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import { formattedAmount } from "../../lib/utils";

export default function ShiftCard({ dateTime, dateHours, totalAmout }) {
  const theme = useTheme();
  const styles = makeStyle(theme);
  const { t } = useTranslation();

  return (
    <Card style={styles.cardShift} elevation={1}>
      <Card.Content>
        <View style={styles.cardDetails}>
          <View style={styles.shiftAmount}>
            <Text variant="labelLarge" style={styles.darkTextBold}>
              {t("shifts.amount")}
            </Text>
            <Text variant="headlineSmall" style={styles.darkText}>
              {formattedAmount(totalAmout)}₪
            </Text>
          </View>
          <View style={styles.shiftDate}>
            <Text variant="labelLarge" style={styles.darkText}>
              {dateTime}
            </Text>
            <Text variant="labelMedium" style={styles.darkText}>
              {dateHours}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

const makeStyle = (theme) =>
  StyleSheet.create({
    cardDetails: {
      flexDirection: "row",
      justifyContent: "space-around",
      textAlign: "left",
    },
    cardShift: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      marginBottom: 10,
      marginHorizontal: 3,
      marginVertical: 3,
    },
    shiftAmount: {
      justifyContent: "center",
      alignItems: "center",
      color: theme.colors.primary,
    },
    shiftDate: {
      textAlign: "center",
      justifyContent: "center",
      alignItems: "center",
      gap: 5,
    },
    darkTextBold: {
      color: theme.colors.primary,
      fontWeight: "600",
    },
    dateText: {
      color: theme.colors.darkText,
      marginBottom: 4,
    },
  });
