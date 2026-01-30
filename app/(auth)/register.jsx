import * as AppleAuthentication from "expo-apple-authentication";
import { useTranslation } from "react-i18next";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Button, Icon, Text, useTheme } from "react-native-paper";
import { PrivacyConsent } from "../../components/common/privacyConsent";
import { useAuth } from "../../hooks/auth-context";
import { useLanguage } from "../../hooks/lang-context";

export default function RegisterScreen() {
  // import the signIn function we allready created
  const { signInWithGoogle, signInWithApple } = useAuth();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const theme = useTheme();
  const styles = makeStyle(theme, isRTL);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.headerWrapper}>
          <View style={styles.headerContent}>
            <Text variant="headlineMedium" style={styles.title}>
              {t("create_acc.title")}
            </Text>
            <Icon
              source="account-plus"
              color={theme.colors.primary}
              size={30}
            />
          </View>
        </View>
        <View style={styles.dividerContainer}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>{t("create_acc.or")}</Text>
          <View style={styles.line} />
        </View>
        <View style={styles.authButtonsContainer}>
          {Platform.OS === "ios" && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={
                AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP
              }
              buttonStyle={
                AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
              }
              cornerRadius={10}
              style={styles.appleBtn}
              onPress={() => signInWithApple()}
            />
          )}
          <Button
            mode="outlined"
            onPress={() => signInWithGoogle()}
            style={styles.googleBtn}
            contentStyle={styles.googleBtnContent}
            labelStyle={styles.googleBtnLabel}
            icon="google"
          >
            Sign up with Google
          </Button>
          <PrivacyConsent />
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const makeStyle = (theme, isRTL) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: 10,
    },

    logoIcon: {
      width: 80,
      height: 80,
      marginBottom: 10,
      alignSelf: "center",
    },

    title: {
      textAlign: "center",
      color: theme.colors.primary,
      fontWeight: 600,
    },

    headerWrapper: {
      marginTop: 150,
    },

    headerContent: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 10,
    },
    contentWrapper: {
      padding: 20,
      gap: 15,
    },
    contentStyle: {
      textAlign: isRTL ? "right" : "left",
      writingDirection: isRTL ? "rtl" : "ltr",
    },
    input: {
      flexDirection: "row",
      height: 60,
      fontSize: 16,
      width: "100%",
      borderRadius: 20,
    },
    btn: {
      paddingVertical: 6,
      borderRadius: 20,
      width: "50%",
      marginTop: 20,
      alignContent: "center",
      marginLeft: "auto",
      marginRight: "auto",
      backgroundColor: "#75a2ddff",
      fontSize: 18,
    },
    dividerContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginVertical: 20,
      marginHorizontal: 20,
      width: "90%",
    },
    line: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.primary,
    },
    dividerText: {
      marginHorizontal: 10,
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: "500",
    },
    authButtonsContainer: {
      width: "100%",
      alignItems: "center",
      marginTop: 10,
      flexDirection: "column",
    },
    appleBtn: {
      width: "90%",
      height: 44,
    },
    googleBtn: {
      width: "90%",
      height: 44,
      marginTop: 15,
      borderRadius: 10,
      borderColor: "#e0e0e0",
      backgroundColor: "#fff",
      justifyContent: "center",
    },
    googleBtnContent: {
      height: 44,
    },
    googleBtnLabel: {
      color: "#000",
      fontWeight: 500,
      fontSize: 19,
      letterSpacing: -1,
    },
  });
