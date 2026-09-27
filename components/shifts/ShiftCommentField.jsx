import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Text, TextInput, useTheme } from "react-native-paper";
import { useLanguage } from "../../hooks/lang-context";
import { inputTextStart, radius, textStart } from "../../lib/theme";

// Multiline TextInput for the optional per-shift note. Used inside the
// Add/Edit Shift screen.
//
// The label is drawn by hand into the outline gap rather than passed to
// Paper as `label`. Paper animates a floating label with a translateX it
// derives from `I18nManager.isRTL`, which this app deliberately keeps
// false, and adds a second offset for a left adornment. Under the mirrored
// layout both offsets push the label the wrong way and the outline gap is
// measured for the wrong edge, so "הערה" slid out of the field and was
// clipped to its first few letters. A static label has no such maths, and
// it matches how ShiftDatePicker and PeriodPicker already label their
// fields, so Add Shift reads consistently.
export default function ShiftCommentField({
  value,
  onChangeText,
  maxLength = 500,
}) {
  const theme = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const styles = makeStyle(theme);

  return (
    <View style={styles.wrapper}>
      <TextInput
        mode="outlined"
        placeholder={t("add_shift.note_placeholder")}
        value={value}
        onChangeText={onChangeText}
        multiline
        numberOfLines={3}
        maxLength={maxLength}
        left={<TextInput.Icon icon="note-text-outline" />}
        contentStyle={{ textAlign: inputTextStart(isRTL) }}
        style={styles.input}
        outlineStyle={styles.outline}
      />
      <Text style={styles.label}>{t("add_shift.note_label")}</Text>
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
      borderRadius: radius.control,
    },
    // Sits in the gap in the outline. `start` is logical, so it follows the
    // field's leading edge in both directions.
    label: {
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
  });
