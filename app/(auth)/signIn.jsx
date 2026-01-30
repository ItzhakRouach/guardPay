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

export default function SignInScreen() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  // import the signIn function we allready created
  const { signInWithGoogle, signInWithApple } = useAuth();
  const theme = useTheme();
  const styles = makeStyle(theme, isRTL);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.headerWrapper}></View>
        <View style={styles.headerContent}>
          <Icon source="login" size="30" color={theme.colors.primary} />
          <Text style={styles.title}>{t("signin.title")}</Text>
        </View>

        <View style={styles.dividerContainer}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>{t("signin.or")}</Text>
          <View style={styles.line} />
        </View>
        <View style={styles.authButtonsContainer}>
          {Platform.OS === "ios" && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={
                AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
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
            Sign in with Google
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
      marginBottom: 5,
      alignSelf: "center",
    },

    title: {
      textAlign: "center",
      color: theme.colors.primary,
      fontWeight: 600,
      fontSize: 30,
      marginRight: 25,
    },
    headerContent: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 10,
    },

    headerWrapper: {
      alignItems: "center",
      justifyContent: "center",
      padding: 10,
      marginTop: 150,
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
