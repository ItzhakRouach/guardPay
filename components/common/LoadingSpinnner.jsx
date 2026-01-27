import { StyleSheet, View } from "react-native";
import { ActivityIndicator, useTheme } from "react-native-paper";

export default function LoadingSpinner() {
  const theme = useTheme();
  const styles = makeStyle(theme);
  return (
    <View style={[styles.container, { justifyContent: "center" }]}>
      <ActivityIndicator
        size="70"
        color={theme.colors.primary}
        animating={true}
      />
    </View>
  );
}

const makeStyle = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.backgroundColor,
      padding: 30,
      alignSelf: "center",
      justifyContent: "center",
    },
  });
