import { StyleSheet, View } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import { formattedAmount } from "../../../lib/utils";

export default function MonthNetoCard({ neto }) {
  const theme = useTheme();
  const styles = makeStyle(theme);
  return (
    <Card style={styles.netoContainer}>
      <Card.Content style={styles.cardStyle}>
        <View>
          <Text variant="titleLarge" style={styles.netoField}>
            Neto:
          </Text>
        </View>
        <View>
          <Text variant="titleLarge" style={styles.income}>
            {formattedAmount(neto)}₪
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
}

const makeStyle = (theme) =>
  StyleSheet.create({
    netoContainer: {
      marginTop: 40,
      backgroundColor: theme.colors.surface,
      padding: 10,
      marginHorizontal: 20,
    },
    cardStyle: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    income: {
      fontWeight: "bold",
      color: "#10B981",
      marginRight: 10,
    },
    netoField: {
      fontWeight: "bold",
      marginLeft: 50,
      color: theme.colors.primary,
    },
  });
