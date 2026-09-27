import * as AppleAuthentication from "expo-apple-authentication";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Icon,
  Portal,
  Snackbar,
  Text,
  useTheme,
} from "react-native-paper";
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
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  // Sign-in helpers resolve to { ok, cancelled?, kind? }. A dismissed
  // sheet says nothing; an unreachable backend says so; anything else
  // gets a generic retry message. Previously every failure was silent.
  const showResult = (result) => {
    if (!result || result.ok || result.cancelled) return;
    if (result.kind === "network") {
      setNotice(t("service.network_body"));
    } else if (result.kind === "paused" || result.kind === "server") {
      setNotice(t("service.unavailable_body"));
    } else {
      setNotice(t("service.signin_failed"));
    }
  };

  const handleAppleSignIn = async () => {
    if (isLoading) return;
    try {
      setIsLoading(true);
      showResult(await signInWithApple());
    } catch (e) {
      console.log(e);
      setNotice(t("service.signin_failed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isLoading) return;
    try {
      setIsLoading(true);
      showResult(await signInWithGoogle());
    } catch (e) {
      console.log(e);
      setNotice(t("service.signin_failed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator
              animating={true}
              color={theme.colors.primary}
              size={80}
            />
          </View>
        )}
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
              onPress={() => handleAppleSignIn()}
            />
          )}
          <Button
            mode="outlined"
            onPress={() => handleGoogleSignIn()}
            style={styles.googleBtn}
            contentStyle={styles.googleBtnContent}
            labelStyle={styles.googleBtnLabel}
            icon="google"
          >
            Sign in with Google
          </Button>
          <PrivacyConsent />
        </View>
        <Portal>
          <Snackbar
            visible={!!notice}
            onDismiss={() => setNotice(null)}
            duration={4000}
          >
            {notice}
          </Snackbar>
        </Portal>
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
      width: "100%",
      maxWidth: 600,
      alignSelf: "center",
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
      flexDirection: "row",
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
    loadingOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 100,
      backgroundColor: theme.colors.background,
    },
  });
