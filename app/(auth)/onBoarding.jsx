import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import { useLanguage } from "../../hooks/lang-context";

export default function OnBoardingScreen() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const theme = useTheme();
  const styles = makeStyle(theme, isRTL);

  //set navigation so can navigate to the correct View
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        <Text variant="headlineLarge" style={styles.title}>
          Guard<Text style={styles.titleSec}>Pay</Text>
        </Text>
        <Text variant="bodyLarge" style={styles.intro}>
          {t("landing.subTitle")}
        </Text>
      </View>
      <View style={styles.btnContainer}>
        <Button
          mode="contained"
          labelStyle={styles.btnLabel}
          style={styles.btn}
          buttonColor="#E2EAF2"
          textColor={theme.colors.onSecondaryContainer}
          onPress={() => router.push("/signIn")}
        >
          {t("landing.signin")}
        </Button>
        <Button
          mode="outlined"
          labelStyle={styles.btnLabel}
          style={styles.secondeBtn}
          textColor={theme.colors.primary}
          onPress={() => router.push("/register")}
        >
          {t("landing.create_acc")}
        </Button>
      </View>
    </View>
  );
}

const makeStyle = (theme, isRTL) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
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
      color: theme.colors.primary,
    },
    titleSec: {
      color: "#5e98d7ff",
      fontWeight: 700,
    },
    intro: {
      color: theme.colors.onSurface,
      fontWeight: 600,
      lineHeight: 25,
      letterSpacing: 1,
      marginTop: 15,
      padding: 5,
      opacity: 0.7,
      fontSize: 16,
      textAlign: isRTL ? "right" : "left",

      writingDirection: isRTL ? "rtl" : "ltr",
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
      fontWeight: 700,
      paddingVertical: 12,
      paddingHorizontal: 20,
      fontSize: 18,
      letterSpacing: 0.5,
      borderColor: theme.colors.outline,
    },

    icon: {
      width: 80,
      height: 80,
      marginBottom: 20,
    },

    secondeBtn: {
      borderColor: theme.colors.borderOutline,
      borderWidth: 1,
    },
  });
