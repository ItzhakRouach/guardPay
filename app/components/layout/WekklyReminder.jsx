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

export default function WeeklyReminder({
  visable,
  hideModal,
  tempDay,
  setTempDay,
  tempTime,
  setTempTime,
  handleSaveReminder,
}) {
  const theme = useTheme();
  const styles = makeStyle(theme);

  return (
    <>
      <Portal>
        <Modal
          visible={visable}
          onDismiss={hideModal}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>Reminder Settings</Text>
          <Text style={styles.label}>Select Day:</Text>
          <SegmentedButtons
            value={tempDay}
            onValueChange={setTempDay}
            buttons={[
              { value: 1, label: "S" },
              { value: 2, label: "M" },
              { value: 3, label: "T" },
              { value: 4, label: "W" },
            ]}
            style={styles.segmented}
          />
          <SegmentedButtons
            value={tempDay}
            onValueChange={setTempDay}
            buttons={[
              { value: 5, label: "T" },
              { value: 6, label: "F" },
              { value: 7, label: "S" },
            ]}
            style={styles.segmented}
          />
          <Text style={styles.label}>Select Time:</Text>
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
            Update Reminder
          </Button>
        </Modal>
      </Portal>
    </>
  );
}

const makeStyle = (theme) =>
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
    },
    segmented: {
      marginBottom: 10,
    },
    saveBtn: {
      marginTop: 25,
      borderRadius: 15,
    },
  });
