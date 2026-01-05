import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, View } from "react-native";
import { ID } from "react-native-appwrite";
import { Button, Surface, Text, TextInput, useTheme } from "react-native-paper";
import { DATABASE_ID, SHIFTS_HISTORY, databases } from "../lib/appwrite";
import { useAuth } from "../lib/auth-context";
import { calculateShiftPay } from "../lib/shift-calculation";

export default function AddShift() {
  const theme = useTheme();
  // store user date of the shift
  const [date, setDate] = useState(new Date());
  //store user start time of the shift
  const [startTime, setStartTime] = useState(new Date());
  //store user end time of the shift
  const [endTime, setEndTime] = useState(new Date());

  const params = useLocalSearchParams();
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (params.existingData) {
      try {
        const shiftData = JSON.parse(params.existingData);
        setIsEditMode(true);
        // 1. Set states using the parsed data
        setDate(new Date(shiftData.start_time));
        setStartTime(new Date(shiftData.start_time));
        setEndTime(new Date(shiftData.end_time));
      } catch (err) {
        console.log(err);
      }
    }
  }, [params.existingData]);

  const router = useRouter();

  // use to control the show of the picker or not , default not
  const [show, setShow] = useState(false);
  // use to control which picker mode to display the user
  const [pickerMode, setPickerMode] = useState("date");
  // use to keep track of which field is active
  const [activeField, setActiveField] = useState(null);
  const { user, profile } = useAuth();

  const buttonLabel = isEditMode ? "Update Shift" : "Save Shift";

  // Live calculations of hours
  const shiftSummary = useMemo(() => {
    let s = new Date(startTime);
    let e = new Date(endTime);
    if (e < s) e.setDate(e.getDate() + 1);
    const hours = (e - s) / (1000 * 60 * 60);
    return hours > 0 ? hours.toFixed(1) : "0.00";
  }, [startTime, endTime]);

  // function to open the picker when user cliked on
  const openPicker = (mode, field) => {
    //set the picekr mode to the field that use cliked on
    setPickerMode(mode);
    // set the active field to the cliked field
    setActiveField(field);
    // set show to true to show the picker
    setShow(true);
  };

  //handle the assignment of the values depend on the active field
  const handleValueChanges = (event, selectedValue) => {
    if (selectedValue) {
      if (activeField === "date") setDate(selectedValue);
      if (activeField === "start") setStartTime(selectedValue);
      if (activeField === "end") setEndTime(selectedValue);
    }
    if (Platform.OS === "android") setShow(false);
  };

  const handleSave = async () => {
    const finalStart = new Date(date);
    finalStart.setHours(startTime.getHours(), startTime.getMinutes());

    const finalEnd = new Date(date);
    finalEnd.setHours(endTime.getHours(), endTime.getMinutes());

    // calculate by the rules
    const result = calculateShiftPay(
      finalStart,
      finalEnd,
      profile.price_per_hour,
      profile.price_per_ride
    );
    console.log(result.extra_hours);
    console.log(result.reg_hours);
    console.log(result.total_amount);

    try {
      if (isEditMode && params.shiftId) {
        // UPDATE EXISTING
        await databases.updateDocument(
          DATABASE_ID,
          SHIFTS_HISTORY,
          params.shiftId,
          {
            start_time: finalStart.toISOString(),
            end_time: finalEnd.toISOString(),
            total_amount: Number(result.total_amount),
            reg_hours: Number(result.reg_hours),
            extra_hours: Number(result.extra_hours),
          }
        );
      } else {
        //Create new entry
        await databases.createDocument(
          DATABASE_ID,
          SHIFTS_HISTORY,
          ID.unique(),
          {
            user_id: user.$id,
            start_time: finalStart.toISOString(),
            end_time: finalEnd.toISOString(),
            total_amount: Number(result.total_amount),
            reg_hours: Number(result.reg_hours),
            extra_hours: Number(result.extra_hours),
          }
        );
      }
    } catch (err) {
      console.log(err);
    } finally {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Shift Details
      </Text>

      <Surface style={styles.formCard} elevation={1}>
        <View style={styles.formContentWrapper}>
          {/** Date Section */}
          <Pressable onPress={() => openPicker("date", "date")}>
            <View pointerEvents="none">
              <TextInput
                label="Work Date"
                value={date.toLocaleDateString("en-GB")}
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="calendar-range" />}
              />
            </View>
          </Pressable>

          {/** Time Section */}
          <View style={styles.timeRow}>
            <Pressable
              style={styles.flex1}
              onPress={() => openPicker("time", "start")}
            >
              <View pointerEvents="none">
                <TextInput
                  label="Start Time"
                  value={startTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                  mode="outlined"
                  left={<TextInput.Icon icon="clock-start" />}
                  style={{ textAlign: "center" }}
                />
              </View>
            </Pressable>

            <View style={styles.arrowIcon}>
              <TextInput.Icon icon="arrow-right" />
            </View>

            <Pressable
              style={styles.flex1}
              onPress={() => openPicker("time", "end")}
            >
              <View pointerEvents="none">
                <TextInput
                  label="End Time"
                  value={endTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                  mode="outlined"
                  right={<TextInput.Icon icon="clock-end" />}
                  style={{ textAlign: "center" }}
                />
              </View>
            </Pressable>
          </View>
        </View>
      </Surface>
      {/** Summmary Box */}
      <Surface style={styles.summaryBox} elevation={0}>
        <View style={styles.summaryRow}>
          <Text variant="bodyLarge">Total Duration:</Text>
          <Text variant="titleLarge" style={{ color: theme.colors.primary }}>
            {shiftSummary} Hours{" "}
          </Text>
        </View>
        {Number(shiftSummary) > 12 && (
          <Text style={styles.warningText}>
            ⚠️ Shifts longer than 12h require attention.
          </Text>
        )}
      </Surface>
      <Button
        mode="contained"
        style={styles.saveBtn}
        contentStyle={{ paddingVertical: 8 }}
        onPress={() => handleSave()}
      >
        {buttonLabel}
      </Button>

      {/**Modal Picker */}
      {show && (
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
                display="spinner"
                onChange={handleValueChanges}
              />
            </Surface>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 20,
  },
  title: {
    color: "#213448",
    fontWeight: "bold",
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  formCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 10,
    marginTop: 20,
    marginBottom: 20,
  },
  formContentWrapper: {
    borderRadius: 16,
    overflow: "hidden",
    padding: 10,
  },
  input: {
    backgroundColor: "white",
    height: 60,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  flex1: {
    flex: 1,
  },
  arrowIcon: {
    margin: 5,
    justifyContent: "center",
    opacity: 0.5,
  },
  summaryBox: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 30,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  warningText: {
    color: "#B91C1C", // Red for warnings
    fontSize: 12,
    marginTop: 10,
    fontWeight: "500",
  },
  saveBtn: {
    borderRadius: 12,
    backgroundColor: "#213448",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)", // Dim the background
    justifyContent: "flex-end",
  },
  pickerWrapper: {
    backgroundColor: "white",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingBottom: Platform.OS === "ios" ? 40 : 20, // Extra padding for iOS notch
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
});
