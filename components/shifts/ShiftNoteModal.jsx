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
  Modal,
  Portal,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { useLanguage } from "../../hooks/lang-context";
import {
  DATABASE_ID,
  SHIFTS_HISTORY,
  databases,
} from "../../lib/appwrite";

// Edit-comment modal launched from Shift Details. Writes shift.comment
// straight to the shifts_history document; caller passes the shift and an
// `onSaved` callback to refresh local state.
export default function ShiftNoteModal({ visible, onDismiss, shift, onSaved }) {
  const theme = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const styles = makeStyle(theme, isRTL);

  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setValue(shift?.comment ?? "");
    }
  }, [visible, shift?.comment]);

  const handleSave = async () => {
    if (!shift?.$id) return;
    const trimmed = value.trim();
    if (trimmed === (shift.comment ?? "")) {
      onDismiss();
      return;
    }
    setSaving(true);
    try {
      await databases.updateDocument(DATABASE_ID, SHIFTS_HISTORY, shift.$id, {
        comment: trimmed,
      });
      onSaved?.(trimmed);
      onDismiss();
    } catch (err) {
      console.log("Failed to save shift note:", err);
    } finally {
      setSaving(false);
    }
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
              {t("shiftDetails.editNote")}
            </Text>

            <TextInput
              mode="outlined"
              label={t("add_shift.note_label")}
              placeholder={t("add_shift.note_placeholder")}
              value={value}
              onChangeText={setValue}
              multiline
              numberOfLines={4}
              maxLength={500}
              left={<TextInput.Icon icon="note-text-outline" />}
              contentStyle={{ textAlign: isRTL ? "right" : "left" }}
              style={styles.input}
              outlineStyle={styles.outline}
            />

            <View style={styles.actions}>
              <Button mode="text" onPress={onDismiss} disabled={saving}>
                {t("common.cancel")}
              </Button>
              <Button
                mode="contained"
                onPress={handleSave}
                loading={saving}
                disabled={saving}
              >
                {t("shiftDetails.saveNote")}
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
    input: {
      backgroundColor: theme.colors.surface,
      minHeight: 110,
      marginBottom: 16,
    },
    outline: {
      borderRadius: 12,
    },
    actions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 8,
    },
  });
