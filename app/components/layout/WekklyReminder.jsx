import DateTimePicker from "@react-native-community/datetimepicker";
import { StyleSheet } from "react-native";
import {
  Button,
  Modal,
  Portal,
  SegmentedButtons,
  Text,
  useTheme,
} from "react-native-paper";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../../lib/lang-context";

export default function WeeklyReminder({
  visable,
  hideModal,
  tempDay,
  setTempDay,
  tempTime,
  setTempTime,
  handleSaveReminder,
}) {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const theme = useTheme();
  const styles = makeStyle(theme, isRTL);

  return (
    <>
      <Portal>
        <Modal
          visible={visable}
          onDismiss={hideModal}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>
            {t("weekly_reminder.reminder_setting")}
          </Text>
          <Text style={styles.label}>{t("weekly_reminder.select_day")}:</Text>
          <SegmentedButtons
            value={tempDay}
            onValueChange={setTempDay}
            buttons={
              isRTL
                ? [
                    { value: 1, label: t("days.sun") },
                    { value: 2, label: t("days.mon") },
                    { value: 3, label: t("days.tue") },
                    { value: 4, label: t("days.wed") },
                  ].reverse()
                : [
                    { value: 1, label: t("days.sun") },
                    { value: 2, label: t("days.mon") },
                    { value: 3, label: t("days.tue") },
                    { value: 4, label: t("days.wed") },
                  ]
            }
            style={styles.segmented}
          />
          <SegmentedButtons
            value={tempDay}
            onValueChange={setTempDay}
            buttons={
              isRTL
                ? [
                    { value: 5, label: t("days.thu") },
                    { value: 6, label: t("days.fri") },
                    { value: 7, label: t("days.sat") },
                  ].reverse()
                : [
                    { value: 5, label: t("days.thu") },
                    { value: 6, label: t("days.fri") },
                    { value: 7, label: t("days.sat") },
                  ]
            }
            style={styles.segmented}
          />
          <Text style={styles.label}>{t("weekly_reminder.select_time")}:</Text>
          <DateTimePicker
            value={tempTime}
            mode="time"
            display="spinner"
            onChange={(event, date) => date && setTempTime(date)}
            textColor={theme.colors.onSurface}
          />

          <Button
            mode="contained"
            onPress={handleSaveReminder}
            style={styles.saveBtn}
            contentStyle={{ height: 50 }}
          >
            {t("weekly_reminder.update")}
          </Button>
        </Modal>
      </Portal>
    </>
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
    label: {
      fontSize: 16,
      marginBottom: 8,
      marginTop: 15,
      fontWeight: "600",
      textAlign: isRTL ? "right" : "left",
      writingDirection: isRTL ? "rtl" : "ltr",
    },
    segmented: {
      marginBottom: 10,
    },
    saveBtn: {
      marginTop: 25,
      borderRadius: 15,
    },
  });
