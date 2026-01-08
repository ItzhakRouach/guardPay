import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

export default function NoShiftFound({ monthName }) {
  const theme = useTheme();
  const styles = makeStyle(theme);

  return (
    <View style={styles.noShifts}>
      <Text
        variant="headlineSmall"
        style={{
          letterSpacing: -1,
          fontWeight: 500,
          color: theme.colors.primary,
        }}
      >
        No shifts added for {monthName}
      </Text>
    </View>
  );
}

const makeStyle = (theme) =>
  StyleSheet.create({
    noShifts: {
      justifyContent: "center",
      alignItems: "center",
      marginTop: "auto",
      marginBottom: "auto",
    },
  });
