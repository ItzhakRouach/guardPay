import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Keyboard,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  Button,
  Chip,
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
import { normalizeDecimal } from "../../lib/utils";
import LoadingSpinner from "../common/LoadingSpinnner";
import GuardRateChips from "../common/GuardRateChips";
import { radius, textStart } from "../../lib/theme";

// normalizeDecimal returns a cleaned STRING ("52,5" → "52.5"); turn it into
// a number, with empty → NaN so validation catches it.
const toNumber = (v) => {
  const cleaned = normalizeDecimal(v);
  return cleaned === "" ? NaN : Number(cleaned);
};

const CREDIT_PRESETS = [
  { key: "credit_man", value: "2.25" },
  { key: "credit_woman", value: "2.75" },
];

export default function PreferencesChange({ visable, hideModal }) {
  const theme = useTheme();
  const { isRTL } = useLanguage();
  const { user, profile, fetchUserProfile } = useAuth();
  const { t } = useTranslation();
  const styles = makeStyle(theme, isRTL);

  const [formData, setFormData] = useState({
    price_per_hour: "",
    price_per_ride: "",
    credit_points: "",
  });
  const [loading, setLoading] = useState(false);

  // Refresh fields with the latest profile data each time the modal opens.
  useEffect(() => {
    if (visable && profile) {
      setFormData({
        price_per_hour: String(profile.price_per_hour || ""),
        price_per_ride: String(profile.price_per_ride || ""),
        // Credit points default to 2.25 everywhere the calculation reads
        // them; show that default rather than an empty field.
        credit_points: String(Number(profile.credit_points) || 2.25),
      });
    }
  }, [visable, profile]);

  const handleSaveBtn = async () => {
    if (!formData.price_per_hour || !formData.price_per_ride) return;
    // Same normalisation as the setup wizard: "52,5" → 52.5. parseFloat
    // alone silently saved 52.
    const hour = toNumber(formData.price_per_hour);
    const ride = toNumber(formData.price_per_ride);
    const credit = toNumber(formData.credit_points);
    if (
      !Number.isFinite(hour) ||
      !Number.isFinite(ride) ||
      !Number.isFinite(credit) ||
      hour < 0 ||
      ride < 0 ||
      credit <= 0 ||
      credit > 20
    ) {
      Alert.alert(t("edit_pref.invalid_number"));
      return;
    }
    setLoading(true);
    try {
      await databases.updateDocument(DATABASE_ID, USERS_PREFS, profile.$id, {
        price_per_hour: hour,
        price_per_ride: ride,
        credit_points: credit,
      });
      await fetchUserProfile(user);
      hideModal();
    } catch (err) {
      console.log("Failed to update preferences:", err);
      Alert.alert(t("edit_pref.msg_err"));
    } finally {
      setLoading(false);
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
              <GuardRateChips
                value={formData.price_per_hour}
                onPick={(v) =>
                  setFormData((prev) => ({ ...prev, price_per_hour: v }))
                }
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

              <Text
                variant="labelMedium"
                style={[styles.inputLabel, { marginTop: 10 }]}
              >
                {t("edit_pref.label_credit")}
              </Text>
              <TextInput
                mode="outlined"
                keyboardType="decimal-pad"
                left={<TextInput.Icon icon="star-outline" />}
                value={formData.credit_points}
                onChangeText={(val) =>
                  setFormData((prev) => ({ ...prev, credit_points: val }))
                }
                style={styles.input}
                outlineStyle={styles.inputOutline}
              />
              <View style={styles.chipRow}>
                {CREDIT_PRESETS.map((p) => (
                  <Chip
                    key={p.key}
                    compact
                    style={styles.creditChip}
                    selected={
                      toNumber(formData.credit_points) === Number(p.value)
                    }
                    onPress={() =>
                      setFormData((prev) => ({
                        ...prev,
                        credit_points: p.value,
                      }))
                    }
                  >
                    {t(`edit_pref.${p.key}`)}
                  </Chip>
                ))}
              </View>
              <Text variant="bodySmall" style={styles.hint}>
                {t("edit_pref.credit_hint")}
              </Text>
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
        {loading && <LoadingSpinner overlay />}
      </Modal>
    </Portal>
  );
}

const makeStyle = (theme, isRTL) =>
  StyleSheet.create({
    modalContainer: {
      backgroundColor: theme.colors.surface,
      margin: 20,
      borderRadius: radius.sheet,
      overflow: "hidden",
    },
    innerContainer: {
      padding: 24,
    },
    header: {
      flexDirection: "row",
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
      textAlign: textStart,
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
    chipRow: {
      flexDirection: "row",
      gap: 8,
      marginTop: 8,
    },
    // Paper multiplies theme.roundness by 2 for Chip, which would give 22.
    creditChip: { borderRadius: radius.control },
    hint: {
      marginTop: 8,
      paddingHorizontal: 4,
      color: theme.colors.onSurfaceVariant,
      textAlign: textStart,
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
