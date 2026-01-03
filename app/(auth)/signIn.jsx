import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { Button, Icon, Text, TextInput, useTheme } from "react-native-paper";
import { useAuth } from "../../lib/auth-context";

export default function SignInScreen() {
  // define the fields we need to get from user in order to let him sign in
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  //define error so we can display errors that may occure
  const [error, setError] = useState(null);
  // import the signIn function we allready created
  const { signIn } = useAuth();
  const theme = useTheme();

  //define functions to handle signIn
  const handleSignIn = async () => {
    if (!email || !password) {
      setError("Please fill in both fields");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 character long.");
    }
    setError(null);

    try {
      await signIn(email, password);
    } catch (err) {
      console.log(err);
      setError("Username or Password are Invalid , please try again.");
      setTimeout(() => {
        setError(null);
      }, 5000);
    }
  };

  return (
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
            Sign in
          </Text>
          <Icon source="location-enter" color={"#213448"} size={30} />
        </View>
      </View>
      <View style={styles.contentWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          mode="outlined"
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
          activeOutlineColor="#75a2ddff"
          textColor="#000"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          mode="outlined"
          secureTextEntry
          onChangeText={setPassword}
          activeOutlineColor="#75a2ddff"
          textColor="#000"
        />

        {error && (
          <Text
            style={{ color: theme.colors.error, fontSize: 16, fontWeight: 600 }}
          >
            {error}
          </Text>
        )}

        <Button mode="contained" style={styles.btn} onPress={handleSignIn}>
          Sign in
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
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
    color: "#213448",
    fontWeight: 600,
  },

  headerWrapper: {
    marginBottom: 30,
  },

  headerContent: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  contentWrapper: {
    padding: 20,
    gap: 15,
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
    fontWeight: 600,
    fontSize: 18,
  },
});
