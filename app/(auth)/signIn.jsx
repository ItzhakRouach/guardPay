import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  Button,
  Icon,
  IconButton,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { useAuth } from "../../lib/auth-context";
import { useLanguage } from "../../lib/lang-context";

export default function SignInScreen() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  // define the fields we need to get from user in order to let him sign in
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  //define error so we can display errors that may occure
  const [error, setError] = useState(null);
  // import the signIn function we allready created
  const { signIn, signInWithGoogle } = useAuth();
  const theme = useTheme();
  const styles = makeStyle(theme, isRTL);

  //define functions to handle signIn
  const handleSignIn = async () => {
    if (!email || !password) {
      setError(t("error.miss_fields"));
      return;
    }
    if (password.length < 6) {
      setError(t("error.pass_len"));
    }
    setError(null);

    try {
      await signIn(email, password);
    } catch (err) {
      console.log(err);
      setError(t("error.not_auth"));
      setTimeout(() => {
        setError(null);
      }, 5000);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.headerWrapper}>
          <Image
            style={styles.logoIcon}
            source={require("../../assets/images/GuardAppIcon.png")}
          />
          <View style={styles.headerContent}>
            <Text variant="headlineMedium" style={styles.title}>
              {t("signin.title")}
            </Text>
            <Icon
              source="location-enter"
              color={theme.colors.primary}
              size={30}
            />
          </View>
        </View>
        <View style={styles.contentWrapper}>
          <TextInput
            style={styles.input}
            placeholder={t("signin.email")}
            mode="outlined"
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            activeOutlineColor="#75a2ddff"
            contentStyle={styles.contentTextStyle}
            textColor={theme.colors.onSurface}
          />
          <TextInput
            style={styles.input}
            placeholder={t("signin.password")}
            mode="outlined"
            secureTextEntry
            onChangeText={setPassword}
            activeOutlineColor="#75a2ddff"
            textColor={theme.colors.onSurface}
            contentStyle={styles.contentTextStyle}
          />

          {error && (
            <Text
              style={{
                color: theme.colors.error,
                fontSize: 16,
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              {error}
            </Text>
          )}

          <Button
            mode="contained"
            labelStyle={{ color: theme.colors.onSurface, fontWeight: 700 }}
            style={styles.btn}
            onPress={handleSignIn}
          >
            {t("signin.signin")}
          </Button>
          <View style={styles.dividerContainer}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>{t("signin.or")}</Text>
            <View style={styles.line} />
          </View>
          <IconButton
            icon="google"
            size={40}
            style={{ alignSelf: "center" }}
            iconColor={theme.colors.primary}
            onPress={async () => {
              const success = await signInWithGoogle();
              if (!success) {
                Alert.alert("Error", "Google sign in failed");
              }
            }}
          />
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
      alignItems: "center",
      justifyContent: "center",
    },

    logoIcon: {
      width: 100,
      height: 100,
      marginBottom: 20,
      alignSelf: "center",
    },

    title: {
      textAlign: "center",
      color: theme.colors.primary,
      fontWeight: 600,
    },

    headerWrapper: {
      marginBottom: 30,
    },

    headerContent: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 10,
      writingDirection: isRTL ? "rtl" : "ltr",
    },
    contentWrapper: {
      padding: 20,
      gap: 15,
    },
    contentTextStyle: {
      textAlign: isRTL ? "right" : "left",
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
      backgroundColor: "rgba(255, 255, 255, 0.3)", // קו חצי שקוף
    },
    dividerText: {
      marginHorizontal: 10,
      color: "#64748B", // אפור משני
      fontSize: 14,
      fontWeight: "500",
    },
  });
