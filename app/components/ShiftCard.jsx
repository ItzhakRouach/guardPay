import { StyleSheet, View } from "react-native";
import { Card, Divider, Text } from "react-native-paper";

export default function ShiftCard({ dateTime, dateHours, totalAmout }) {
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

const styles = StyleSheet.create({
  verticalDivider: {
    width: 2,
    backgroundColor: "#213448",
    height: 60,
  },
  cardDetails: {
    flexDirection: "row",
    justifyContent: "space-around",
    textAlign: "left",
  },
  cardShift: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 10,
  },
  shiftAmount: {
    justifyContent: "center",
    alignItems: "center",
    color: "#213448",
  },
  shiftDate: {
    textAlign: "center",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  darkTextBold: {
    color: "#213448",
    fontWeight: "600",
  },
  dateText: {
    color: "#64748B", // Slate gray for secondary info
    marginBottom: 4,
  },
});
