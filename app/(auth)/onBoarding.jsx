import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { SafeAreaView, StyleSheet, View } from "react-native";
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
    <SafeAreaView style={styles.safeArea}>
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
    </SafeAreaView>
  );
}

const makeStyle = (theme, isRTL) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
      paddingVertical: 10,
      paddingHorizontal: 20,
      width: "100%",
      maxWidth: 600,
    },
    contentWrapper: {
      alignItems: "center",
      paddingHorizontal: 40,
      justifyContent: "center",
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
      lineHeight: 26,
      letterSpacing: 1,
      marginTop: 15,
      opacity: 0.7,
      fontSize: 16,
      textAlign: isRTL ? "right" : "left",
      maxWidth: 300,

      writingDirection: isRTL ? "rtl" : "ltr",
    },
    btnContainer: {
      width: "100%",
      gap: 15,
      marginTop: 20,
    },
    btnLabel: {
      fontWeight: 700,
      paddingVertical: 8,
      fontSize: 17,
      letterSpacing: 0.5,
    },

    icon: {
      width: 80,
      height: 80,
      marginBottom: 20,
    },
    btn: {
      borderRadius: 30,
      width: "100%",
    },
    secondeBtn: {
      borderRadius: 30,
      borderColor: theme.colors.borderOutline || theme.colors.outline,
      borderWidth: 1,
      width: "100%",
    },
  });
