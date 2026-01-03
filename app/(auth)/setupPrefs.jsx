import { useState } from "react";
import {
  Keyboard,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { ID } from "react-native-appwrite";
import {
  Button,
  ProgressBar,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import {
  DatePickerInput,
  en,
  registerTranslation,
} from "react-native-paper-dates";
import { DATABASE_ID, databases, USERS_PREFS } from "../../lib/appwrite";
import { useAuth } from "../../lib/auth-context";
registerTranslation("en", en);

export default function SetupProfileScreen() {
  //create state to manage the pages
  const [step, setStep] = useState(1);
  // State to store all user fields data
  const [formData, setFormData] = useState({
    user_name: "",
    age: "",
    birth_date: undefined,
    price_per_hour: 0,
    price_per_ride: 0,
  });

  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, fetchUserProfile } = useAuth();
  const theme = useTheme();

  // function that after the user fill all the fields in page 1 , then on click next show
  // the new page
  const handleFirstStep = () => {
    if (!formData.age || !formData.user_name || !formData.birth_date) {
      setError("Must fill all the fields!");
      setTimeout(() => {
        setError(null);
      }, 2500);
      return;
    }
    if (step < 2) {
      setStep((prev) => prev + 1);
    }
  };

  // handle submiting thr fields the user enter and complete his profile
  const handleSubmit = async () => {
    if (!formData.price_per_hour || !formData.price_per_ride) {
      setError("Must fill all the fields!");
      setTimeout(() => {
        setError(null);
      }, 3000);
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      console.log("DATABASE_ID =", DATABASE_ID);
      console.log("USERS_PREFS =", USERS_PREFS);
      await databases.createDocument(DATABASE_ID, USERS_PREFS, ID.unique(), {
        user_id: user.$id,
        price_per_hour: parseFloat(formData.price_per_hour),
        price_per_ride: parseFloat(formData.price_per_ride),
        user_name: formData.user_name,
        age: formData.age,
        birth_date: formData.birth_date,
      });
      await fetchUserProfile(user);
    } catch (err) {
      console.log(`Error: ${err}`);
      setError("Error Happend. Please Try again in 3 seconds.");
      setTimeout(() => {
        setIsLoading(false);
        setError(null);
      }, 2500);
    } finally {
      setIsLoading(false);
    }
  };

  // function to handle the back button
  const handlePrev = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    } else {
      return;
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <Text variant="displaySmall" style={styles.title}>
          Finish-up Your Profile
        </Text>

        {/** Initilize all the view for the different pages */}
        {step === 1 && (
          <View style={styles.stepsContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                placeholder="Enter your full name"
                mode="outlined"
                value={formData.user_name}
                style={styles.textInput}
                onChangeText={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    user_name: val,
                  }))
                }
                label="Name"
              />
              <TextInput
                placeholder="Enter your Age"
                mode="outlined"
                value={formData.age}
                onChangeText={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    age: val,
                  }))
                }
                keyboardType="numeric"
                label="Age"
              />
              <DatePickerInput
                locale="en"
                label="Date of Birth"
                inputMode="start"
                animationType="fade"
                style={{ marginTop: 5 }}
                presentationStyle="pageSheet"
                mode="outlined"
                value={formData.birth_date}
                onChange={(d) =>
                  setFormData({ ...formData, birth_date: d || undefined })
                }
              />
              {error && (
                <Text
                  variant="bodySmall"
                  style={{
                    color: theme.colors.error,
                    fontSize: 18,
                    fontWeight: 500,
                    textAlign: "center",
                    marginTop: 20,
                    padding: 10,
                  }}
                >
                  {error}
                </Text>
              )}
            </View>
          </View>
        )}
        {step === 2 && (
          <View style={styles.stepsContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                placeholder="Enter your Hourly Rate"
                mode="outlined"
                value={formData.price_per_hour}
                style={styles.textInput}
                onChangeText={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    price_per_hour: val,
                  }))
                }
                label="Hour Rate"
                keyboardType="numeric"
              />
              <TextInput
                placeholder="Enter your Ride Rate"
                mode="outlined"
                value={formData.price_per_ride}
                onChangeText={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    price_per_ride: val,
                  }))
                }
                keyboardType="numeric"
                label="Ride Rate"
              />
              {error && (
                <Text
                  variant="bodySmall"
                  style={{
                    color: theme.colors.error,
                    fontSize: 18,
                    fontWeight: 500,
                    textAlign: "center",
                    marginTop: 20,
                    padding: 10,
                  }}
                >
                  {error}
                </Text>
              )}
            </View>
          </View>
        )}
        <View style={styles.progressWrapper}>
          <ProgressBar progress={step / 2} style={styles.progress} />
        </View>
        <View style={styles.btnContainer}>
          <Button
            icon="chevron-left"
            mode="contained"
            style={styles.btn}
            onPress={() => handlePrev()}
          >
            Back
          </Button>
          <Button
            icon={step !== 2 ? "chevron-right" : "check-all"}
            mode="contained"
            style={styles.btn}
            onPress={() => (step === 1 ? handleFirstStep() : handleSubmit())}
          >
            {step === 2 ? "Finish" : "Next"}
          </Button>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    gap: 20,
  },
  stepsContainer: {
    marginTop: 20,
  },
  title: {
    textAlign: "center",
    color: "#213448",
    fontWeight: 600,
    letterSpacing: -1,
  },
  progressWrapper: {
    position: "absolute",
    bottom: 30,
    right: 20,
    left: 20,
  },
  inputWrapper: {
    marginTop: 20,
  },
  textInput: {
    marginBottom: 10,
  },
  btnContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    position: "absolute",
    bottom: 60,
    left: 20,
    right: 20,
  },
  btn: {
    width: "30%",
    color: "#fff",
    fontWeight: 600,
    fontSize: 18,
  },
});
