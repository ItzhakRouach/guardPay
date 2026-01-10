import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Keyboard,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { ID, Query } from "react-native-appwrite";
import { Button, Text, useTheme } from "react-native-paper";
import {
  DATABASE_ID,
  SHIFTS_HISTORY,
  USERS_PREFS,
  databases,
} from "../lib/appwrite";
import { useAuth } from "../lib/auth-context";
import { calculateShiftPay } from "../lib/shift-calculation";
import { shiftTypeTimes } from "../lib/utils";
import DateTimeModal from "./components/shifts/DateTimeModal";
import ShiftDatePicker from "./components/shifts/ShiftDatePicker";
import ShiftSummary from "./components/shifts/ShiftSummary";
import ShiftTypeSelected from "./components/shifts/ShiftTypeSelected";

export default function AddShift() {
  // use to control the show of the picker or not , default not
  const [show, setShow] = useState(false);
  // use to control which picker mode to display the user
  const [pickerMode, setPickerMode] = useState("date");
  // use to keep track of which field is active
  const [activeField, setActiveField] = useState(null);

  const [hourRate, setHourRate] = useState(0);

  const [loading, setLoading] = useState(true);

  //store user start time of the shift
  const [startTime, setStartTime] = useState(new Date());
  //store user end time of the shift
  const [endTime, setEndTime] = useState(new Date());

  // store user date of the shift
  const [date, setDate] = useState(new Date());

  // function to open the picker when user cliked on
  const openPicker = (mode, field) => {
    //set the picekr mode to the field that use cliked on
    setPickerMode(mode);
    // set the active field to the cliked field
    setActiveField(field);
    // set show to true to show the picker
    setShow(true);
  };

  const theme = useTheme();
  const styles = makeStyle(theme);

  // store the current shift type the user selected
  const [value, setValue] = useState("");

  const params = useLocalSearchParams();
  const [isEditMode, setIsEditMode] = useState(false);

  const fetchUserRates = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await databases.listDocuments(DATABASE_ID, USERS_PREFS, [
        Query.equal("user_id", user.$id),
        Query.select("price_per_hour"),
      ]);
      if (response.documents.length > 0) {
        const doc = response.documents[0];
        setHourRate(Number(doc.price_per_hour));
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

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
    fetchUserRates();
  }, [params.existingData, fetchUserRates]);

  const router = useRouter();

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
      hourRate,
      profile.price_per_ride
    );
    const documentData = {
      user_id: user.$id,
      start_time: finalStart.toISOString(),
      end_time: finalEnd.toISOString(),
      total_amount: Number(result.total_amount),
      reg_hours: Number(result.reg_hours),
      extra_hours: Number(result.extra_hours),
      reg_pay_amount: Number(result.reg_pay_amount),
      extra_pay_amount: Number(result.extra_pay_amount),
      travel_pay_amount: Number(result.travel_pay_amount),
      h100_hours: Number(result.h100_hours),
      h125_extra_hours: Number(result.h125_extra_hours),
      h150_extra_hours: Number(result.h150_extra_hours),
      h175_extra_hours: Number(result.h175_extra_hours),
      h200_extra_hours: Number(result.h200_extra_hours),
      h150_shabat: Number(result.h150_shabat),
      base_rate: hourRate,
    };
    try {
      if (isEditMode && params.shiftId) {
        // UPDATE EXISTING
        await databases.updateDocument(
          DATABASE_ID,
          SHIFTS_HISTORY,
          params.shiftId,
          documentData
        );
      } else {
        //Create new entry
        await databases.createDocument(
          DATABASE_ID,
          SHIFTS_HISTORY,
          ID.unique(),
          documentData
        );
      }
    } catch (err) {
      console.log(err);
    } finally {
      router.back();
    }
  };

  //function to handle the selected shit type  , and update the hours like it should be.
  const handleShiftTypeChange = (selected) => {
    setValue(selected);

    const config = shiftTypeTimes[selected];
    if (!config) return;

    // create new Start Hour based on the selected value
    const newStart = new Date(date);
    newStart.setHours(config.startH, config.startM, 0, 0);

    // create new End Hour based on the selected value
    const newEnd = new Date(date);
    newEnd.setHours(config.endH, config.endM, 0, 0);

    //Check for overnight shifts support
    if (
      config.endH < config.startH ||
      (config.endH === config.startH && config.endM < config.startM)
    ) {
      newEnd.setDate(newEnd.getDate() + 1);
    }

    setStartTime(newStart);
    setEndTime(newEnd);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <Text variant="headlineMedium" style={styles.title}>
          Add New Shift
        </Text>
        {/**Shift date and time picker */}
        <ShiftDatePicker
          date={date}
          startTime={startTime}
          endTime={endTime}
          openPicker={openPicker}
          loading={loading}
          setHourRate={setHourRate}
          hourRate={hourRate}
        />
        {/**Shift type selected */}
        <View style={styles.shiftTypesWrapper}>
          <ShiftTypeSelected
            value={value}
            handleShiftTypeChange={handleShiftTypeChange}
          />
        </View>

        {/** Summmary Box */}
        <ShiftSummary shiftSummary={shiftSummary} />
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
          <DateTimeModal
            show={show}
            activeField={activeField}
            setShow={setShow}
            pickerMode={pickerMode}
            handleValueChanges={handleValueChanges}
            date={date}
            startTime={startTime}
            endTime={endTime}
          />
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const makeStyle = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,

      padding: 20,
    },
    title: {
      color: theme.colors.onSurface,
      fontWeight: "bold",
      marginBottom: 20,
      letterSpacing: -0.5,
    },

    saveBtn: {
      borderRadius: 12,
      backgroundColor: theme.colors.primary,
    },

    shiftTypesWrapper: {
      backgroundColor: theme.colors.surface,
      marginBottom: 20,
      borderRadius: 20,
    },
  });
