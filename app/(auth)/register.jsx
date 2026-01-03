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

export default function RegisterScreen() {
  // define the fields we need to get from user in order to let him sign in
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  //define error so we can display errors that may occure
  const [error, setError] = useState(null);
  // import the signIn function we allready created
  const { signUp } = useAuth();
  const theme = useTheme();

  //define functions to handle signIn
  const handleSignUp = async () => {
    if (!email || !password || !rePassword) {
      setError("Please fill in both fields");
      setTimeout(() => {
        setError(null);
      }, 3000);
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 character long.");
      setTimeout(() => {
        setError(null);
      }, 3000);
      return;
    }
    if (password !== rePassword) {
      setError("Password must be the same");
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
            Create Account
          </Text>
          <Icon source="account-plus" color={"#213448"} size={30} />
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

        <TextInput
          style={styles.input}
          placeholder="Re-Password"
          mode="outlined"
          secureTextEntry
          activeOutlineColor="#75a2ddff"
          textColor="#000"
          onChangeText={setRePassword}
        />

        {error && (
          <Text
            style={{ color: theme.colors.error, fontSize: 16, fontWeight: 600 }}
          >
            {error}
          </Text>
        )}

        <Button
          mode="contained"
          style={styles.btn}
          onPress={() => handleSignUp()}
        >
          Sign Up
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
    marginBottom: 10,
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
