import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Keyboard,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  Button,
  Divider,
  IconButton,
  Modal,
  Portal,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { useAuth } from "../../hooks/auth-context";
import { useLanguage } from "../../hooks/lang-context";
import { DATABASE_ID, USERS_PREFS, databases } from "../../lib/appwrite";
import LoadingSpinner from "../common/LoadingSpinnner";

export default function PreferencesChange({ visable, hideModal }) {
  const theme = useTheme();
  const { isRTL } = useLanguage();
  const { profile, loading, reloadProfile } = useAuth(); // הוספתי reloadProfile כדי שהשינוי ישתקף מיד
  const { t } = useTranslation();
  const styles = makeStyle(theme, isRTL);

  const [formData, setFormData] = useState({
    price_per_hour: "",
    price_per_ride: "",
  });

  // עדכון השדות במידע הקיים כשהמודאל נפתח
  useEffect(() => {
    if (visable && profile) {
      setFormData({
        price_per_hour: String(profile.price_per_hour || ""),
        price_per_ride: String(profile.price_per_ride || ""),
      });
    }
  }, [visable, profile]);

  const handleSaveBtn = async () => {
    if (!formData.price_per_hour || !formData.price_per_ride) return;

    try {
      await databases.updateDocument(DATABASE_ID, USERS_PREFS, profile.$id, {
        price_per_hour: parseFloat(formData.price_per_hour),
        price_per_ride: parseFloat(formData.price_per_ride),
      });

      if (reloadProfile) await reloadProfile(); // רענון המידע באפליקציה
      hideModal();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <Portal>
      <Modal
        visible={visable}
        onDismiss={hideModal}
        contentContainerStyle={styles.modalContainer}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.innerContainer}>
            {/* Header עם כפתור סגירה */}
            <View style={styles.header}>
              <Text style={styles.modalTitle}>{t("edit_pref.title")}</Text>
              <IconButton
                icon="close"
                size={20}
                onPress={hideModal}
                style={styles.closeIcon}
              />
            </View>

            <Divider style={styles.divider} />

            <View style={styles.form}>
              <Text variant="labelMedium" style={styles.inputLabel}>
                {t("edit_pref.label_hour")}
              </Text>
              <TextInput
                mode="outlined"
                keyboardType="decimal-pad"
                left={<TextInput.Icon icon="cash-clock" />}
                right={<TextInput.Affix text="₪" />}
                value={formData.price_per_hour}
                onChangeText={(val) =>
                  setFormData((prev) => ({ ...prev, price_per_hour: val }))
                }
                style={styles.input}
                outlineStyle={styles.inputOutline}
              />

              <Text
                variant="labelMedium"
                style={[styles.inputLabel, { marginTop: 10 }]}
              >
                {t("edit_pref.label_ride")}
              </Text>
              <TextInput
                mode="outlined"
                keyboardType="decimal-pad"
                left={<TextInput.Icon icon="car" />}
                right={<TextInput.Affix text="₪" />}
                value={formData.price_per_ride}
                onChangeText={(val) =>
                  setFormData((prev) => ({ ...prev, price_per_ride: val }))
                }
                style={styles.input}
                outlineStyle={styles.inputOutline}
              />
            </View>

            <View style={styles.actions}>
              <Button
                mode="contained"
                onPress={handleSaveBtn}
                style={styles.saveBtn}
                contentStyle={styles.btnContent}
                labelStyle={styles.btnLabel}
              >
                {t("edit_pref.btn")}
              </Button>

              <Button mode="text" onPress={hideModal} style={styles.cancelBtn}>
                {t("common.cancel") || "ביטול"}
              </Button>
            </View>
          </View>
        </TouchableWithoutFeedback>
        {loading && <LoadingSpinner />}
      </Modal>
    </Portal>
  );
}

const makeStyle = (theme, isRTL) =>
  StyleSheet.create({
    modalContainer: {
      backgroundColor: theme.colors.surface,
      margin: 20,
      borderRadius: 28,
      overflow: "hidden",
    },
    innerContainer: {
      padding: 24,
    },
    header: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    closeIcon: {
      margin: 0,
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.colors.onSurface,
      letterSpacing: -0.5,
    },
    divider: {
      marginBottom: 20,
      opacity: 0.5,
    },
    form: {
      marginBottom: 24,
    },
    inputLabel: {
      marginBottom: 6,
      color: theme.colors.secondary,
      textAlign: isRTL ? "right" : "left",
      paddingHorizontal: 4,
    },
    input: {
      backgroundColor: theme.colors.surface,
      fontSize: 18,
    },
    inputOutline: {
      borderRadius: 12,
      borderWidth: 1.5,
    },
    actions: {
      gap: 8,
    },
    saveBtn: {
      borderRadius: 14,
      elevation: 0,
    },
    btnContent: {
      height: 48,
    },
    btnLabel: {
      fontSize: 16,
      fontWeight: "bold",
    },
    cancelBtn: {
      marginTop: 4,
    },
  });
