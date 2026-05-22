import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { TextInput, useTheme } from "react-native-paper";
import { useLanguage } from "../../hooks/lang-context";

// Multiline TextInput for the optional per-shift note. Used inside the
// Add/Edit Shift screen.
export default function ShiftCommentField({ value, onChangeText, maxLength = 500 }) {
  const theme = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const styles = makeStyle(theme, isRTL);

  return (
    <View style={styles.wrapper}>
      <TextInput
        mode="outlined"
        label={t("add_shift.note_label")}
        placeholder={t("add_shift.note_placeholder")}
        value={value}
        onChangeText={onChangeText}
        multiline
        numberOfLines={3}
        maxLength={maxLength}
        left={<TextInput.Icon icon="note-text-outline" />}
        contentStyle={{ textAlign: isRTL ? "right" : "left" }}
        style={styles.input}
        outlineStyle={styles.outline}
      />
    </View>
  );
}

const makeStyle = (theme) =>
  StyleSheet.create({
    wrapper: {
      marginTop: 5,
      marginHorizontal: 10,
      marginBottom: 15,
    },
    input: {
      backgroundColor: theme.colors.surface,
      minHeight: 80,
    },
    outline: {
      borderRadius: 12,
    },
  });
