import {
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from "react-native";
import {
  Text,
  Portal,
  Modal,
  useTheme,
  Button,
  TextInput,
} from "react-native-paper";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../lib/lang-context";
import { useAuth } from "../../lib/auth-context";
import { useState } from "react";
import { DATABASE_ID, USERS_PREFS, databases } from "../../lib/appwrite";
import { Query } from "react-native-appwrite";
import LoadingSpinner from "./common/LoadingSpinnner";

export default function PreferencesChange({ visable, hideModal }) {
  const theme = useTheme();
  const { isRTL } = useLanguage();
  const { profile, loading } = useAuth();
  const { t } = useTranslation();
  const styles = makeStyle(theme, isRTL);
  const [formData, setFormData] = useState({
    price_per_hour: "",
    price_per_ride: "",
  });
  const [message, setMessage] = useState("");

  const handleSaveBtn = async () => {
    try {
      await databases.updateDocument(DATABASE_ID, USERS_PREFS, profile.$id, {
        price_per_hour: parseFloat(formData.price_per_hour),
        price_per_ride: parseFloat(formData.price_per_ride),
      });
      setMessage(t("edit_pref.msg_good"));
      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (err) {
      console.log(err);
      setMessage(t("edit_pref.msg_err"));
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <Portal>
        <Modal
          visible={visable}
          onDismiss={hideModal}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>{t("edit_pref.title")}</Text>
          {loading && <LoadingSpinner />}
          <View>
            <TextInput
              label={t("edit_pref.label_hour")}
              mode="outlined"
              keyboardType="numeric"
              value={formData.price_per_hour}
              onChangeText={(val) =>
                setFormData((prev) => ({ ...prev, price_per_hour: val }))
              }
              style={styles.input}
            />
            <TextInput
              label={t("edit_pref.label_ride")}
              mode="outlined"
              keyboardType="numeric"
              value={formData.price_per_ride}
              onChangeText={(val) =>
                setFormData((prev) => ({ ...prev, price_per_ride: val }))
              }
              style={styles.input}
            />
          </View>
          <Button
            mode="contained"
            stye={styles.saveBtn}
            onPress={() => handleSaveBtn()}
          >
            {t("edit_pref.btn")}
          </Button>
          {message && Alert.alert(message)}
        </Modal>
      </Portal>
    </TouchableWithoutFeedback>
  );
}

const makeStyle = (theme, isRTL) =>
  StyleSheet.create({
    modalContainer: {
      backgroundColor: theme.colors.surface,
      padding: 25,
      margin: 20,
      borderRadius: 30,
      width: "90%",
      alignSelf: "center",
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: "700",
      textAlign: "center",
      marginBottom: 20,
      color: theme.colors.primary,
    },
    message: {
      color: "green",
      textAlign: "center",
      padding: 20,
      marginTop: 10,
    },
    input: {
      marginBottom: 15,
      textAlign: isRTL ? "right" : "left",
      writingDirection: isRTL ? "rtl" : "ltr",
    },
    saveBtn: {
      marginTop: 10,
      borderRadius: 8,
    },
  });
