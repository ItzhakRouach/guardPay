import DateTimePicker from "@react-native-community/datetimepicker";
import { useTranslation } from "react-i18next";
import { Modal, Platform, Pressable, StyleSheet, View } from "react-native";
import { Button, Surface, Text, useTheme } from "react-native-paper";
import { useLanguage } from "../../hooks/lang-context";

export default function DateTimeModal({
  show,
  activeField,
  setShow,
  pickerMode,
  handleValueChanges,
  date,
  startTime,
  endTime,
  sickEndDate,
  vacEndDate,
}) {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const theme = useTheme();
  const styles = makeStyle(theme, isRTL);
  return (
    <Modal transparent visible={show} animationType="slide">
      <Pressable style={styles.modalOverlay} onPress={() => setShow(false)}>
        <Surface style={styles.pickerWrapper}>
          <View style={styles.pickerHeader}>
            <Text variant="titleMedium">
              {" "}
              {t("date_time_picker.select")}{" "}
              {t(`date_time_picker.${activeField}`)}
            </Text>
            <Button onPress={() => setShow(false)}>
              {t("date_time_picker.done")}
            </Button>
          </View>
          <DateTimePicker
            value={
              activeField === "date"
                ? date
                : activeField === "start"
                ? startTime
                : activeField === "sickEnd"
                ? sickEndDate || new Date()
                : activeField === "vacEnd"
                ? vacEndDate || new Date()
                : endTime
            }
            mode={pickerMode}
            is24Hour={true}
            display={
              activeField === "date" ||
              activeField === "sickEnd" ||
              activeField === "vacEnd"
                ? "inline"
                : "spinner"
            }
            // iOS pickers otherwise follow the SYSTEM appearance, so in
            // app-light / system-dark the inline calendar renders pale
            // (dark-variant) text on our light surface. Pin the variant +
            // colors to the app theme so every date stays readable.
            themeVariant={theme.dark ? "dark" : "light"}
            accentColor={theme.colors.primary}
            textColor={theme.colors.onSurface}
            onChange={handleValueChanges}
          />
        </Surface>
      </Pressable>
    </Modal>
  );
}

const makeStyle = (theme, isRTL) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)", // Dim the background
      justifyContent: "flex-end",
    },
    pickerWrapper: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 25,
      borderTopRightRadius: 25,
      paddingBottom: Platform.OS === "ios" ? 40 : 20, // Extra padding for iOS notch
      elevation: 5,
    },
    pickerHeader: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
  });
