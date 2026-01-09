import { useRouter } from "expo-router";
import { StyleSheet } from "react-native";
import { IconButton, useTheme } from "react-native-paper";

export default function AddShiftButton() {
  const router = useRouter();
  const theme = useTheme();
  const styles = makeStyle(theme);

  return (
    <IconButton
      style={styles.btn}
      icon="plus"
      size={30}
      mode="contained"
      iconColor="white"
      containerColor={theme.colors.primary}
      onPress={() => {
        try {
          router.push("/add-shift");
        } catch (err) {
          console.log(err);
        }
      }}
    />
  );
}

const makeStyle = (theme) =>
  StyleSheet.create({
    btn: {
      position: "absolute",
      bottom: 100,
      alignSelf: "center",
    },
  });
