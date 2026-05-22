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
  HelperText,
  Modal,
  Portal,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { useLanguage } from "../../hooks/lang-context";
import { parseHHMM } from "../../lib/shiftTimes";

// Sub-modal for editing the start + end time of one shift-time preset
// (morning / evening / night). Uses two HH:MM text inputs so the same
// UX works on both iOS and Android without leaning on the native
// date-time picker for what's really a two-number input.
//
// Calls `onSave({ startH, startM, endH, endM })` on Save; the caller
// is responsible for persistence + closing.
export default function ShiftTimeEditModal({
  visible,
  onDismiss,
  title,
  currentTimes,
  onSave,
}) {
  const theme = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const styles = makeStyle(theme, isRTL);

  const [startText, setStartText] = useState("");
  const [endText, setEndText] = useState("");
  const [error, setError] = useState(null);

  // Hydrate fields when the modal opens with a fresh `currentTimes`.
  useEffect(() => {
    if (visible && currentTimes) {
      setStartText(
        `${String(currentTimes.startH).padStart(2, "0")}:${String(
          currentTimes.startM,
        ).padStart(2, "0")}`,
      );
      setEndText(
        `${String(currentTimes.endH).padStart(2, "0")}:${String(
          currentTimes.endM,
        ).padStart(2, "0")}`,
      );
      setError(null);
    }
  }, [visible, currentTimes]);

  const handleSave = () => {
    const start = parseHHMM(startText);
    const end = parseHHMM(endText);
    if (!start || !end) {
      setError(t("shift_times.invalid_format"));
      return;
    }
    onSave({
      startH: start.hour,
      startM: start.minute,
      endH: end.hour,
      endM: end.minute,
    });
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View>
            <Text variant="titleLarge" style={styles.title}>
              {title}
            </Text>

            <View style={styles.row}>
              <View style={styles.fieldWrap}>
                <Text variant="labelMedium" style={styles.fieldLabel}>
                  {t("shift_times.start_time")}
                </Text>
                <TextInput
                  mode="outlined"
                  value={startText}
                  onChangeText={setStartText}
                  placeholder="HH:MM"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  style={styles.timeInput}
                  outlineStyle={styles.outline}
                />
              </View>
              <View style={styles.fieldWrap}>
                <Text variant="labelMedium" style={styles.fieldLabel}>
                  {t("shift_times.end_time")}
                </Text>
                <TextInput
                  mode="outlined"
                  value={endText}
                  onChangeText={setEndText}
                  placeholder="HH:MM"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  style={styles.timeInput}
                  outlineStyle={styles.outline}
                />
              </View>
            </View>

            {error && (
              <HelperText type="error" visible={!!error}>
                {error}
              </HelperText>
            )}

            <View style={styles.actions}>
              <Button mode="text" onPress={onDismiss}>
                {t("common.cancel")}
              </Button>
              <Button mode="contained" onPress={handleSave}>
                {t("shift_times.save")}
              </Button>
            </View>
          </View>
        </TouchableWithoutFeedback>
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
      padding: 24,
    },
    title: {
      fontWeight: "bold",
      color: theme.colors.onSurface,
      marginBottom: 18,
      textAlign: isRTL ? "right" : "left",
    },
    row: {
      flexDirection: isRTL ? "row-reverse" : "row",
      gap: 12,
      marginBottom: 12,
    },
    fieldWrap: {
      flex: 1,
    },
    fieldLabel: {
      color: theme.colors.summary,
      marginBottom: 6,
      textAlign: isRTL ? "right" : "left",
      paddingHorizontal: 4,
    },
    timeInput: {
      backgroundColor: theme.colors.surface,
      fontSize: 20,
      textAlign: "center",
    },
    outline: {
      borderRadius: 12,
    },
    actions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 8,
      marginTop: 8,
    },
  });
