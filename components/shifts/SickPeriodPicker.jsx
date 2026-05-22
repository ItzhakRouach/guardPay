import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { Surface, Text, TextInput, useTheme } from "react-native-paper";
import { useLanguage } from "../../hooks/lang-context";

export default function SickPeriodPicker({ startDate, endDate, openPicker }) {
  const theme = useTheme();
  const { isRTL } = useLanguage();
  const styles = makeStyle(theme, isRTL);
  const { t } = useTranslation();

  return (
    <Surface style={styles.formCard} elevation={1}>
      <View style={styles.formContentWrapper}>
        <Pressable onPress={() => openPicker("date", "date")}>
          <View pointerEvents="none">
            <TextInput
              value={startDate.toLocaleDateString("en-GB")}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="calendar-start" />}
              outlineStyle={styles.outline}
            />
            <Text style={styles.label}>{t("add_shift.sick_start")}</Text>
          </View>
        </Pressable>

        <View style={{ marginTop: 18 }}>
          <Pressable onPress={() => openPicker("date", "sickEnd")}>
            <View pointerEvents="none">
              <TextInput
                value={endDate.toLocaleDateString("en-GB")}
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="calendar-end" />}
                outlineStyle={styles.outline}
              />
              <Text style={styles.label}>{t("add_shift.sick_end")}</Text>
            </View>
          </Pressable>
        </View>
      </View>
    </Surface>
  );
}

const makeStyle = (theme, isRTL) =>
  StyleSheet.create({
    formCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      padding: 5,
      marginTop: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    formContentWrapper: {
      padding: 10,
    },
    input: {
      backgroundColor: theme.colors.surface,
      height: 56,
      marginBottom: 5,
    },
    outline: {
      borderRadius: 12,
    },
    label: {
      position: "absolute",
      top: -8,
      left: isRTL ? undefined : 15,
      right: isRTL ? 15 : undefined,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 6,
      fontSize: 12,
      fontWeight: "bold",
      color: theme.colors.primary,
      zIndex: 1,
    },
  });
