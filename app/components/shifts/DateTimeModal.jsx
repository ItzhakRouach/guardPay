import { StyleSheet, Pressable, Modal, View, Platform } from "react-native";
import { Text, Button, Surface, useTheme } from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function DateTimeModal({
  show,
  activeField,
  setShow,
  pickerMode,
  handleValueChanges,
  date,
  startTime,
  endTime,
}) {
  const theme = useTheme();
  const styles = makeStyle(theme);
  return (
    <Modal transparent visible={show} animationType="slide">
      <Pressable style={styles.modalOverlay} onPress={() => setShow(false)}>
        <Surface style={styles.pickerWrapper}>
          <View style={styles.pickerHeader}>
            <Text variant="titleMedium">Select {activeField}</Text>
            <Button onPress={() => setShow(false)}>Done</Button>
          </View>
          <DateTimePicker
            value={
              activeField === "date"
                ? date
                : activeField === "start"
                ? startTime
                : endTime
            }
            mode={pickerMode}
            is24Hour={true}
            display={activeField === "date" ? "inline" : "spinner"}
            onChange={handleValueChanges}
          />
        </Surface>
      </Pressable>
    </Modal>
  );
}

const makeStyle = (theme) =>
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
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
  });
