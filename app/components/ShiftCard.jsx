import { StyleSheet, View } from "react-native";
import { Card, Divider, Text, useTheme } from "react-native-paper";

export default function ShiftCard({ dateTime, dateHours, totalAmout }) {
  const theme = useTheme();
  const styles = makeStyle(theme);

  return (
    <Card style={styles.cardShift} elevation={1}>
      <Card.Content>
        <View style={styles.cardDetails}>
          <View style={styles.shiftAmount}>
            <Text variant="labelLarge" style={styles.darkTextBold}>
              Amount
            </Text>
            <Text variant="headlineSmall" style={styles.darkText}>
              {totalAmout}₪
            </Text>
          </View>
          <Divider style={styles.verticalDivider} />
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
    verticalDivider: {
      width: 2,
      backgroundColor: theme.colors.divider,
      height: 60,
    },
    cardDetails: {
      flexDirection: "row",
      justifyContent: "space-around",
      textAlign: "left",
    },
    cardShift: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      marginBottom: 10,
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
      gap: 10,
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
