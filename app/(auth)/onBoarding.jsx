import { useRouter } from "expo-router";
import { Image, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";

export default function OnBoardingScreen() {
  //set navigation so can navigate to the correct View
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        <Image
          source={require("../../assets/images/GuardAppIcon.png")}
          style={styles.icon}
        />
        <Text variant="headlineLarge" style={styles.title}>
          Guard<Text style={styles.titleSec}>Pay</Text>
        </Text>
        <Text variant="bodyLarge" style={styles.intro}>
          Stop worrying about missing hours or incorrect paychecks. GuardPay
          tracks every shift with precision, ensuring you get exactly what you
          earned, every single time.
        </Text>
      </View>
      <View style={styles.btnContainer}>
        <Button
          mode="contained"
          labelStyle={styles.btnLabel}
          style={styles.btn}
          buttonColor="#E2EAF2"
          textColor="#213448"
          onPress={() => router.push("/signIn")}
        >
          Sign In
        </Button>
        <Button
          mode="outlined"
          labelStyle={styles.btnLabel}
          style={styles.secondeBtn}
          textColor="#213448"
          onPress={() => router.push("/register")}
        >
          Create Account
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    alignContent: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  contentWrapper: {
    alignItems: "center",
    paddingHorizontal: 40,
    marginTop: "30%",
  },
  title: {
    fontSize: 32,
    letterSpacing: -1,
    fontWeight: 700,
    color: "#213448",
  },
  titleSec: {
    color: "#5e98d7ff",
    fontWeight: 700,
  },
  intro: {
    color: "#213448",
    fontWeight: 400,
    lineHeight: 24,
    marginTop: 15,
    opacity: 0.7,
    fontSize: 16,
    textAlign: "justify",
  },
  btnContainer: {
    flex: 1,
    gap: 12,
    marginTop: 80,
    paddingHorizontal: 20,
    width: "100%",
  },
  btnLabel: {
    borderRadius: 1,
    fontWeight: 500,
    paddingVertical: 12,
    paddingHorizontal: 20,
    fontSize: 18,
    letterSpacing: 0.5,
    borderColor: "#E2E8F0",
  },

  icon: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },

  secondeBtn: {
    borderColor: "rgba(33, 52, 72, 0.5)",
    borderWidth: 1,
  },
});
