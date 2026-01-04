import { StyleSheet, View } from "react-native";
import { Card, Divider, Text } from "react-native-paper";

export function ShiftCard({ dateTime, dateHours, totalAmout }) {
  return (
    <Card style={styles.cardShift}>
      <Card.Content>
        <View style={styles.cardDetails}>
          <View style={styles.shiftAmount}>
            <Text
              variant="labelLarge"
              style={{ color: "#213448", fontWeight: 500 }}
            >
              Amount
            </Text>
            <Text variant="headlineSmall" style={{ color: "#213448" }}>
              {totalAmout}₪
            </Text>
          </View>
          <Divider style={styles.verticalDivider} />
          <View style={styles.shiftDate}>
            <Text variant="labelLarge">{dateTime}</Text>
            <Text variant="labelMedium" style={{ color: "#213448" }}>
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
});
