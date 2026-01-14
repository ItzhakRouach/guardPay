import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Button, Icon, Text, TextInput, useTheme } from "react-native-paper";
import { useAuth } from "../../lib/auth-context";
import { useLanguage } from "../../lib/lang-context";

export default function RegisterScreen() {
  // define the fields we need to get from user in order to let him sign in
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  //define error so we can display errors that may occure
  const [error, setError] = useState(null);
  // import the signIn function we allready created
  const { signUp } = useAuth();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const theme = useTheme();
  const styles = makeStyle(theme, isRTL);

  //define functions to handle signIn
  const handleSignUp = async () => {
    if (!email || !password || !rePassword) {
      setError(t("error.miss_fields"));
      setTimeout(() => {
        setError(null);
      }, 3000);
      return;
    }
    if (password.length < 6) {
      setError(t("error.pass_len"));
      setTimeout(() => {
        setError(null);
      }, 3000);
      return;
    }
    if (password !== rePassword) {
      setError(t("error.pass_not_same"));
      return;
    }
    setError(null);

    try {
      await signUp(email, password);
    } catch (err) {
      console.log(err);
      setError("Username allready exist, try to Sign-in");
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
              {t("create_acc.title")}
            </Text>
            <Icon
              source="account-plus"
              color={theme.colors.primary}
              size={30}
            />
          </View>
        </View>
        <View style={styles.contentWrapper}>
          <TextInput
            style={styles.input}
            placeholder={t("create_acc.email")}
            mode="outlined"
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            activeOutlineColor="#75a2ddff"
            textColor={theme.colors.onSurface}
            contentStyle={styles.contentStyle}
          />
          <TextInput
            style={styles.input}
            placeholder={t("create_acc.password")}
            mode="outlined"
            secureTextEntry
            onChangeText={setPassword}
            activeOutlineColor="#75a2ddff"
            textColor={theme.colors.onSurface}
            contentStyle={styles.contentStyle}
          />

          <TextInput
            style={styles.input}
            placeholder={t("create_acc.re_pass")}
            mode="outlined"
            secureTextEntry
            activeOutlineColor="#75a2ddff"
            textColor={theme.colors.onSurface}
            onChangeText={setRePassword}
            contentStyle={styles.contentStyle}
          />

          {error && (
            <Text
              style={{
                color: theme.colors.error,
                fontSize: 16,
                fontWeight: 600,
                textAlign: "center",
                justifyContent: "center",
              }}
            >
              {error}
            </Text>
          )}

          <Button
            mode="contained"
            style={styles.btn}
            labelStyle={{ color: theme.colors.onSurface, fontWeight: 700 }}
            onPress={() => handleSignUp()}
          >
            {t("create_acc.signup")}
          </Button>
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
      marginBottom: 10,
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
  });
