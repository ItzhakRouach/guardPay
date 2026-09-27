import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Keyboard,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { ID, Query } from "react-native-appwrite";
import { Button, Text, useTheme } from "react-native-paper";
import LoadingSpinner from "../components/common/LoadingSpinnner";
import DateTimeModal from "../components/shifts/DateTimeModal";
import ShiftCommentField from "../components/shifts/ShiftCommentField";
import PeriodPicker from "../components/shifts/PeriodPicker";
import ShiftDatePicker from "../components/shifts/ShiftDatePicker";
import ShiftSummary from "../components/shifts/ShiftSummary";
import ShiftTypeSelected from "../components/shifts/ShiftTypeSelected";
import { useAuth } from "../hooks/auth-context";
import { useLanguage } from "../hooks/lang-context";
import { DATABASE_ID, SHIFTS_HISTORY, databases } from "../lib/appwrite";
import { parseOvertimeRules, toCalcRules } from "../lib/overtimeRules";
import { computeShiftDoc } from "../lib/salaryLogic";
import { applyWeekUpdates, fetchWeekDocs } from "../lib/weeklyOt";
import {
  recomputeWeek,
  regularHoursBefore,
  weekKeyOf,
} from "../lib/weeklyOtCore";
import { findShiftConflicts, sameDayWindow } from "../lib/shiftOverlap";
import { getShiftTimes } from "../lib/shiftTimes";
import { classifyTimeOfDay } from "../lib/shiftType";
import { shiftTypeTimes } from "../lib/utils";
import { buildSickDocs } from "../utils/sickDays";

export default function AddShift() {
  // use to control the show of the picker or not , default not
  const [show, setShow] = useState(false);
  // use to control which picker mode to display the user
  const [pickerMode, setPickerMode] = useState("date");
  // use to keep track of which field is active
  const [activeField, setActiveField] = useState(null);

  const [hourRate, setHourRate] = useState("");
  const [comment, setComment] = useState("");

  const [loading, setLoading] = useState(true);

  //store user start time of the shift
  const [startTime, setStartTime] = useState(new Date());
  //store user end time of the shift
  const [endTime, setEndTime] = useState(new Date());

  // store user date of the shift
  const [date, setDate] = useState(new Date());

  // For sick days: end date of the sick period (start = `date` above)
  const [sickEndDate, setSickEndDate] = useState(new Date());

  // For vacation: end date of the vacation period (start = `date` above)
  const [vacEndDate, setVacEndDate] = useState(new Date());

  // function to open the picker when user cliked on
  const openPicker = (mode, field) => {
    //set the picekr mode to the field that use cliked on
    setPickerMode(mode);
    // set the active field to the cliked field
    setActiveField(field);
    // set show to true to show the picker
    setShow(true);
  };

  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const theme = useTheme();
  const styles = makeStyle(theme, isRTL);

  // store the current shift type the user selected
  const [value, setValue] = useState("");

  const params = useLocalSearchParams();
  const [isEditMode, setIsEditMode] = useState(false);

  const router = useRouter();
  const { user, profile } = useAuth();

  const fetchUserRates = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (!params.existingData) {
        setHourRate("");
      } else {
        const shiftData = JSON.parse(params.existingData);
        setHourRate(shiftData.base_rate || "");
      }
    } catch (err) {
      console.log("Error fetching rates:", err);
    } finally {
      setLoading(false);
    }
  }, [user, params.existingData]);

  useEffect(() => {
    if (params.existingData) {
      try {
        const shiftData = JSON.parse(params.existingData);
        setIsEditMode(true);
        setDate(new Date(shiftData.start_time));
        setStartTime(new Date(shiftData.start_time));
        setEndTime(new Date(shiftData.end_time));
        setHourRate(shiftData.base_rate);
        setComment(shiftData.comment ?? "");
        // Restore the flag-based types; otherwise saving an edited חג shift
        // silently dropped is_holiday. Worked shifts are classified from
        // their times by the effect below.
        if (shiftData.is_holiday) setValue("holiday");
        else if (shiftData.is_training) setValue("training");
      } catch (err) {
        console.log("Error parsing shift data:", err);
      }
    }
    fetchUserRates();
  }, [params.existingData, fetchUserRates]);

  // The type follows the hours, not the other way round: whenever the
  // times change, pick morning / evening / night by where most of the
  // shift falls in the user's windows. Tapping a type still applies its
  // preset times (handleShiftTypeChange), which this then agrees with.
  // Flag types (training / vacation / sick / holiday) are left alone.
  useEffect(() => {
    if (value && !["morning", "evening", "night"].includes(value)) return;
    const next = classifyTimeOfDay(startTime, endTime, profile);
    if (next !== value) setValue(next);
  }, [startTime, endTime, profile, value]);

  const buttonLabel = isEditMode ? "update" : "save";

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
      if (activeField === "sickEnd") setSickEndDate(selectedValue);
      if (activeField === "vacEnd") setVacEndDate(selectedValue);
    }
    if (Platform.OS === "android") setShow(false);
  };

  // Alert.alert with buttons, as a promise, so the save flow can await the
  // user's answer without nesting callbacks.
  const confirmAsync = (title, body) =>
    new Promise((resolve) => {
      Alert.alert(
        title,
        body,
        [
          {
            text: t("common.cancel"),
            style: "cancel",
            onPress: () => resolve(false),
          },
          { text: t("add_shift.save_anyway"), onPress: () => resolve(true) },
        ],
        // Android back-button dismiss calls neither button; without this the
        // promise never settles and Save stays disabled.
        { cancelable: true, onDismiss: () => resolve(false) },
      );
    });

  const handleSave = async () => {
    // Double-tap guard (the Save button is also disabled while loading, but
    // two taps can land before the re-render).
    if (loading) return;
    setLoading(true);
    try {
      const finalBaseRate =
        hourRate === "" || hourRate === null
          ? profile?.price_per_hour
          : Number(hourRate);

      // Sick days follow Israeli sick-leave law and are computed locally.
      // No cloud-function call — we generate one document per day in the
      // selected period and bulk-create them in shifts_history.
      if (value === "sick") {
        if (sickEndDate < date) {
          Alert.alert(
            "שגיאה",
            "תאריך סיום המחלה חייב להיות אחרי תאריך ההתחלה.",
          );
          return;
        }
        const dailyPay = Number(finalBaseRate) * 8;
        const docs = buildSickDocs({
          startDate: date,
          endDate: sickEndDate,
          dailyPay,
          userId: user.$id,
          baseRate: finalBaseRate,
        });
        await Promise.all(
          docs.map((d) =>
            databases.createDocument(DATABASE_ID, SHIFTS_HISTORY, ID.unique(), {
              ...d,
              comment: comment.trim(),
            }),
          ),
        );
        router.back();
        return;
      }

      // Vacation spans a from→to date range (like sick days), but each day
      // is paid the full daily wage with no streak. computeShiftDoc builds
      // the same document the cloud CALCULATE_SHIFT produced for a single
      // vacation day — locally and instantly, no network round-trip.
      if (value === "vacation") {
        const startDay = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
        );
        const endDay = new Date(
          vacEndDate.getFullYear(),
          vacEndDate.getMonth(),
          vacEndDate.getDate(),
        );
        if (endDay < startDay) {
          Alert.alert(
            "שגיאה",
            "תאריך סיום החופשה חייב להיות אחרי תאריך ההתחלה.",
          );
          return;
        }

        const config = shiftTypeTimes.vacation;
        const ONE_DAY_MS = 24 * 60 * 60 * 1000;
        const numDays = Math.round((endDay - startDay) / ONE_DAY_MS) + 1;

        const days = Array.from({ length: numDays }, (_, i) => {
          const day = new Date(startDay.getTime() + i * ONE_DAY_MS);
          const dStart = new Date(day);
          dStart.setHours(config.startH, config.startM, 0, 0);
          const dEnd = new Date(day);
          dEnd.setHours(config.endH, config.endM, 0, 0);
          return { dStart, dEnd };
        });

        await Promise.all(
          days.map(({ dStart, dEnd }) => {
            const docData = computeShiftDoc({
              startTime: dStart.toISOString(),
              endTime: dEnd.toISOString(),
              baseRate: finalBaseRate,
              travelRate: profile.price_per_ride,
              type: "vacation",
              isHoliday: false,
            });
            docData.user_id = user.$id;
            docData.comment = comment.trim();
            return databases.createDocument(
              DATABASE_ID,
              SHIFTS_HISTORY,
              ID.unique(),
              docData,
            );
          }),
        );
        router.back();
        return;
      }

      const finalStart = new Date(date);
      finalStart.setHours(startTime.getHours(), startTime.getMinutes());

      const finalEnd = new Date(date);
      finalEnd.setHours(endTime.getHours(), endTime.getMinutes());
      // Overnight shift: the picker rolled endTime to the next day, but the
      // line above rebuilt it on the shift's date. Roll it forward so the
      // stored end_time is after start_time. (Pay was already right —
      // calculateShiftPay compensates internally — only the stored value
      // was wrong.)
      if (finalEnd.getTime() === finalStart.getTime()) {
        Alert.alert(t("add_shift.zero_length"));
        return;
      }
      if (finalEnd < finalStart) finalEnd.setDate(finalEnd.getDate() + 1);

      // Duplicate / overlap check against the worked shifts already logged
      // around this date. Exact duplicates are blocked; overlaps ask.
      // Training is a calendar day, not a time range (and existing training
      // docs are ignored by the check), so it is skipped symmetrically.
      if (value !== "training") {
        const { from, to } = sameDayWindow(finalStart);
        const nearby = await databases.listDocuments(
          DATABASE_ID,
          SHIFTS_HISTORY,
          [
            Query.equal("user_id", user.$id),
            Query.between("start_time", from, to),
            Query.limit(50),
          ],
        );
        const conflicts = findShiftConflicts(
          finalStart.toISOString(),
          finalEnd.toISOString(),
          nearby.documents,
          { excludeId: isEditMode ? params.shiftId : undefined },
        );
        if (conflicts.exact) {
          Alert.alert(t("add_shift.dup_exact"));
          return;
        }
        if (conflicts.overlapping.length > 0) {
          const proceed = await confirmAsync(
            t("add_shift.overlap_title"),
            t("add_shift.overlap_body"),
          );
          if (!proceed) return;
        }
      }

      // Weekly rule (opt-in): fetch this week's shifts, count the regular
      // hours already used before this one, compute with that context, and
      // afterwards recompute any later shift in the same week.
      const otRules = parseOvertimeRules(profile?.overtime_rules);
      const isWorkedType = value !== "training";
      let weekDocs = [];
      let weeklyBefore = null;
      if (otRules.weekly && isWorkedType) {
        weekDocs = await fetchWeekDocs(user.$id, finalStart);
        weeklyBefore = regularHoursBefore(
          weekDocs,
          finalStart.toISOString(),
          isEditMode ? params.shiftId : undefined,
        );
      }

      // Compute the shift document locally — same result the cloud
      // CALCULATE_SHIFT produced, with no network round-trip.
      const docData = computeShiftDoc({
        startTime: finalStart.toISOString(),
        endTime: finalEnd.toISOString(),
        baseRate: finalBaseRate,
        travelRate: profile.price_per_ride,
        type: value,
        isHoliday: value === "holiday",
        rules:
          otRules.weekly && isWorkedType
            ? toCalcRules(otRules, weeklyBefore)
            : undefined,
      });
      docData.user_id = user.$id;
      docData.comment = comment.trim();
      // Editing with the weekly rule off (or as a non-worked type) must not
      // leave a stale weekly_regular_before from an earlier computation.
      if (isEditMode && !(otRules.weekly && isWorkedType)) {
        docData.weekly_regular_before = null;
      }

      let saved;
      if (isEditMode && params.shiftId) {
        saved = await databases.updateDocument(
          DATABASE_ID,
          SHIFTS_HISTORY,
          params.shiftId,
          docData,
        );
      } else {
        saved = await databases.createDocument(
          DATABASE_ID,
          SHIFTS_HISTORY,
          ID.unique(),
          docData,
        );
      }

      if (otRules.weekly) {
        // Later shifts in the week may now cross the cap earlier (or later).
        // The saved doc stays in the set: with a start-time tie, or earlier
        // docs never computed under the rule, its own numbers can move too
        // (recomputeWeek only returns real differences).
        if (isWorkedType) {
          const others = weekDocs.filter((d) => d.$id !== saved.$id);
          const updates = recomputeWeek([...others, saved], otRules);
          if (updates.length) {
            const { failed } = await applyWeekUpdates(updates);
            if (failed) Alert.alert(t("shifts.week_partial"));
          }
        }
        // An edit that moved the shift to a different week, or turned a
        // worked shift into a training day, leaves a gap in the week it
        // came from: recompute that week too.
        if (isEditMode && params.existingData) {
          try {
            const previous = JSON.parse(params.existingData);
            const leftWeek =
              previous?.start_time &&
              (weekKeyOf(previous.start_time) !== weekKeyOf(finalStart) ||
                !isWorkedType);
            if (leftWeek) {
              const oldWeek = await fetchWeekDocs(
                user.$id,
                previous.start_time,
              );
              const oldUpdates = recomputeWeek(oldWeek, otRules);
              if (oldUpdates.length) {
                const { failed } = await applyWeekUpdates(oldUpdates);
                if (failed) Alert.alert(t("shifts.week_partial"));
              }
            }
          } catch (e) {
            console.log(
              "[add-shift] origin-week recompute skipped:",
              e?.message,
            );
          }
        }
      }

      router.back();
    } catch (err) {
      console.error(err);
      Alert.alert(t("add_shift.err_save"));
    } finally {
      setLoading(false);
    }
  };
  //function to handle the selected shit type  , and update the hours like it should be.
  const handleShiftTypeChange = (selected) => {
    setValue(selected);
    // For morning/evening/night, prefer the user's customised default
    // (Profile → Preferences → Default shift times). Other types
    // (training / vacation / holiday) keep the static shiftTypeTimes
    // values since those aren't user-customisable.
    const config =
      getShiftTimes(selected, profile?.default_shift_times) ||
      shiftTypeTimes[selected];
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
          {!isEditMode ? t("add_shift.add") : t("add_shift.update")}
        </Text>
        {/* Sick days and vacation use a dedicated two-date range picker
            (start + end), one entry per day; all other shift types use the
            standard date + time card. Training hides the time fields since
            it always uses fixed default hours. */}
        {value === "sick" ? (
          <PeriodPicker
            startDate={date}
            endDate={sickEndDate}
            openPicker={openPicker}
            startLabel="add_shift.sick_start"
            endLabel="add_shift.sick_end"
            endField="sickEnd"
          />
        ) : value === "vacation" ? (
          <PeriodPicker
            startDate={date}
            endDate={vacEndDate}
            openPicker={openPicker}
            startLabel="add_shift.vacation_start"
            endLabel="add_shift.vacation_end"
            endField="vacEnd"
          />
        ) : (
          <ShiftDatePicker
            date={date}
            startTime={startTime}
            endTime={endTime}
            openPicker={openPicker}
            loading={loading}
            setHourRate={setHourRate}
            hourRate={hourRate}
            defaultRate={profile?.price_per_hour}
            hideTime={value === "training"}
          />
        )}
        {/**Shift type selected */}
        <View style={styles.shiftTypesWrapper}>
          <ShiftTypeSelected
            value={value}
            handleShiftTypeChange={handleShiftTypeChange}
          />
        </View>

        {/** Optional per-shift note */}
        <ShiftCommentField value={comment} onChangeText={setComment} />

        {/** Summmary Box */}
        <ShiftSummary shiftSummary={shiftSummary} />
        <Button
          mode="contained"
          style={styles.saveBtn}
          contentStyle={{ paddingVertical: 8 }}
          onPress={() => handleSave()}
          disabled={loading}
        >
          {t(`add_shift.${buttonLabel}`)}
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
            sickEndDate={sickEndDate}
            vacEndDate={vacEndDate}
          />
        )}
        {loading && <LoadingSpinner overlay />}
      </View>
    </TouchableWithoutFeedback>
  );
}

const makeStyle = (theme, isRTL) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: 20,
      width: "100%",
      maxWidth: 600,
      alignSelf: "center",
    },
    title: {
      color: theme.colors.onSurface,
      fontWeight: "bold",
      marginBottom: 20,
      letterSpacing: -0.5,
      textAlign: isRTL ? "right" : "left",
      writingDirection: isRTL ? "rtl" : "ltr",
      paddingStart: 10,
    },

    saveBtn: {
      borderRadius: 12,
      backgroundColor: theme.colors.primary,
    },

    shiftTypesWrapper: {
      marginHorizontal: 10,
      paddingHorizontal: 0,
      marginBottom: 30,
    },
  });
