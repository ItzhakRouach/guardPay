import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Keyboard,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { ID } from "react-native-appwrite";
import {
  Button,
  IconButton,
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
import { useLanguage } from "../../lib/lang-context";
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
  const { user, fetchUserProfile, signOut } = useAuth();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  const theme = useTheme();
  const styles = makeStyle(theme, isRTL);

  // function that after the user fill all the fields in page 1 , then on click next show
  // the new page
  const handleFirstStep = () => {
    if (!formData.age || !formData.user_name || !formData.birth_date) {
      setError(t("error.miss_fields"));
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
      setError(t("error.miss_fields"));
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
        <IconButton
          onPress={() => signOut}
          style={styles.signOutBtn}
          icon="logout"
          size={30}
          iconColor={theme.colors.error}
        />

        <Text variant="displaySmall" style={styles.title}>
          {t("setupP.title")}
        </Text>

        {/** Initilize all the view for the different pages */}
        {step === 1 && (
          <View style={styles.stepsContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                placeholder={t("setupP.name")}
                mode="outlined"
                value={formData.user_name}
                style={styles.textInput}
                onChangeText={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    user_name: val,
                  }))
                }
                contentStyle={styles.contentStyle}
              />
              <TextInput
                placeholder={t("setupP.age")}
                contentStyle={styles.contentStyle}
                mode="outlined"
                value={formData.age}
                onChangeText={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    age: val,
                  }))
                }
                keyboardType="numeric"
              />
              <DatePickerInput
                locale="en"
                label={t("setupP.birth")}
                contentStyle={styles.contentStyle}
                inputMode="start"
                animationType="fade"
                style={{ marginTop: 10 }}
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
                placeholder={t("setupP.hour")}
                contentStyle={styles.contentStyle}
                mode="outlined"
                value={formData.price_per_hour}
                style={styles.textInput}
                onChangeText={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    price_per_hour: val,
                  }))
                }
                keyboardType="numeric"
              />
              <TextInput
                placeholder={t("setupP.ride")}
                contentStyle={styles.contentStyle}
                mode="outlined"
                value={formData.price_per_ride}
                onChangeText={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    price_per_ride: val,
                  }))
                }
                keyboardType="numeric"
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
            labelStyle={{ fontWeight: 700 }}
            onPress={() => handlePrev()}
          >
            {t("setupP.prev")}
          </Button>
          <Button
            icon={step !== 2 ? "chevron-right" : "check-all"}
            mode="contained"
            style={styles.btn}
            labelStyle={{ fontWeight: 700 }}
            onPress={() => (step === 1 ? handleFirstStep() : handleSubmit())}
          >
            {step === 2 ? t("setupP.finish") : t("setupP.next")}
          </Button>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const makeStyle = (theme, isRTL) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: theme.colors.background,
      justifyContent: "center",
      gap: 20,
    },
    signOutBtn: {
      position: "absolute",
      top: 100,
      left: 10,
    },
    stepsContainer: {
      marginTop: 20,
    },
    contentStyle: {
      textAlign: isRTL ? "right" : "left",
      writingDirection: isRTL ? "rtl" : "ltr",
    },
    title: {
      textAlign: "center",
      color: theme.colors.primary,
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
      writingDirection: isRTL ? "rtl" : "ltr",
      bottom: 60,
      left: 20,
      right: 20,
    },
    btn: {
      width: "30%",
      fontWeight: 600,
      fontSize: 18,
    },
  });
