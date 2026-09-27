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
  Modal,
  Portal,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { useLanguage } from "../../hooks/lang-context";
import { DATABASE_ID, SHIFTS_HISTORY, databases } from "../../lib/appwrite";
import { inputTextStart, radius, textStart } from "../../lib/theme";

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
      Alert.alert(t("edit_pref.msg_err"));
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

            {/* Static label, not Paper's floating one: Paper derives the
                label's translateX from I18nManager.isRTL (kept false here)
                and adds another offset for the left icon, so under the
                mirrored layout the label slid out of the field and clipped.
                Same treatment as ShiftCommentField. */}
            <View style={styles.fieldWrap}>
              <TextInput
                mode="outlined"
                placeholder={t("add_shift.note_placeholder")}
                value={value}
                onChangeText={setValue}
                multiline
                numberOfLines={4}
                maxLength={500}
                left={<TextInput.Icon icon="note-text-outline" />}
                contentStyle={{ textAlign: inputTextStart(isRTL) }}
                style={styles.input}
                outlineStyle={styles.outline}
              />
              <Text style={styles.floatLabel}>
                {t("add_shift.note_label")}
              </Text>
            </View>

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
      borderRadius: radius.sheet,
      padding: 24,
    },
    title: {
      fontWeight: "bold",
      color: theme.colors.onSurface,
      marginBottom: 18,
      textAlign: textStart,
    },
    // Own positioning context, so the label anchors to the field and not
    // to the modal body above it.
    fieldWrap: {
      marginBottom: 16,
    },
    input: {
      backgroundColor: theme.colors.surface,
      minHeight: 110,
    },
    outline: {
      borderRadius: radius.control,
    },
    // Sits in the gap in the outline; `start` is logical so it follows the
    // field's leading edge in both directions.
    floatLabel: {
      position: "absolute",
      top: -8,
      start: 15,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 6,
      fontSize: 12,
      fontWeight: "bold",
      color: theme.colors.onSurfaceVariant,
      textAlign: textStart,
    },
    actions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 8,
    },
  });
