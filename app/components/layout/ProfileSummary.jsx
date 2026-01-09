import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { StyleSheet } from "react-native";
import {
  Button,
  Divider,
  List,
  Modal,
  Portal,
  SegmentedButtons,
  Surface,
  Switch,
  Text,
  useTheme,
} from "react-native-paper";
import { formatDates } from "../../../lib/utils";

export default function ProfileSummary({
  profile,
  user,
  signout,
  handleEditBtn,
  onUpdateReminder,
  toggleReminder,
}) {
  const [visable, setVisable] = useState(false);
  const [tempDay, setTempDay] = useState(profile.reminder_day || 1);
  const [tempTime, setTempTime] = useState(new Date());
  const [isSwitchOn, setIsSwitchOn] = useState(
    profile.reminder_enable || false
  );

  const showModal = () => setVisable(true);
  const hideModal = () => setVisable(false);
  const onToggleSwitch = async () => {
    const newValue = !isSwitchOn;
    setIsSwitchOn(newValue);
    await toggleReminder(newValue);
  };

  const handleSaveReminder = () => {
    const timeString = tempTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    onUpdateReminder(tempDay, timeString);
    hideModal();
  };

  const getDayName = (dayNum) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days[dayNum - 1] || "Set Day";
  };

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
      <Surface style={styles.contentWrapper} elevation={1}>
        <Text style={styles.title} variant="headlineMedium">
          General
        </Text>
        <List.Item
          style={styles.listItem}
          titleStyle={{ fontSize: 20 }}
          left={(props) => <List.Icon {...props} icon="email" />}
          title={`Email: ${user.email}`}
        />
        <Divider style={styles.dividerStyle} bold={true} />
        <List.Item
          style={styles.listItem}
          titleStyle={{ fontSize: 20 }}
          left={(props) => <List.Icon {...props} icon="account-outline" />}
          title={`Name: ${profile.user_name}`}
        />
        <Divider style={styles.dividerStyle} bold={true} />
        <List.Item
          style={styles.listItem}
          titleStyle={{ fontSize: 20 }}
          left={(props) => <List.Icon {...props} icon="numeric" />}
          title={`Age: ${profile.age}`}
        />
        <Divider style={styles.dividerStyle} bold={true} />
        <List.Item
          style={styles.listItem}
          titleStyle={{ fontSize: 20 }}
          left={(props) => (
            <List.Icon {...props} icon="calendar-account-outline" />
          )}
          title={`Birth Date: ${formatDates(profile.birth_date)}`}
        />
      </Surface>
      {/**Preferences Section */}
      <Surface
        style={[styles.contentWrapper, styles.preferences]}
        elevation={1}
      >
        <Text style={styles.title} variant="headlineMedium">
          Preferences
        </Text>

        <Divider style={styles.dividerStyle} bold={true} />
        <List.Item
          style={styles.listItem}
          titleStyle={{ fontSize: 20 }}
          left={(props) => <List.Icon {...props} icon="cash-clock" />}
          title={`Hour Rate: ${profile.price_per_hour}`}
        />
        <Divider style={styles.dividerStyle} bold={true} />
        <List.Item
          style={styles.listItem}
          titleStyle={{ fontSize: 20 }}
          left={(props) => <List.Icon {...props} icon="cash-fast" />}
          title={`Ride Rate: ${profile.price_per_ride}`}
        />
        <Divider style={styles.dividerStyle} bold={true} />
        <List.Item
          style={styles.listItem}
          titleStyle={{ fontSize: 20 }}
          left={(props) => <List.Icon {...props} icon="alarm" />}
          right={(props) => (
            <Switch value={isSwitchOn} onValueChange={onToggleSwitch} />
          )}
          title={"Weekly Reminder"}
          onPress={showModal}
          description={`Every ${getDayName(profile.reminder_day)} at ${
            profile.reminder_time || "Not set"
          }`}
          descriptionStyle={{ color: theme.colors.secondary }}
        />
      </Surface>
      {/**Account Section */}
      <Surface
        style={[styles.contentWrapper, styles.preferences]}
        elevation={1}
      >
        <Text style={styles.title} variant="headlineMedium">
          Account
        </Text>
        <Divider style={styles.dividerStyle} bold={true} />
        <List.Item
          style={styles.listItem}
          titleStyle={{ fontSize: 20 }}
          left={(props) => (
            <List.Icon
              {...props}
              icon="account-edit"
              color={theme.colors.primary}
            />
          )}
          title={"Edit Preferences"}
          onPress={() => handleEditBtn()}
        />
        <Divider style={styles.dividerStyle} bold={true} />
        <List.Item
          style={styles.listItem}
          titleStyle={{ fontSize: 20 }}
          left={(props) => (
            <List.Icon {...props} icon="logout" color="#E94560" />
          )}
          title={"Log Out"}
          onPress={signout}
        />
      </Surface>
    </>
  );
}

const makeStyle = (theme) =>
  StyleSheet.create({
    contentWrapper: {
      padding: 15,
      marginTop: 5,
      borderRadius: 30,
      backgroundColor: theme.colors.surface,
      marginHorizontal: 10,
    },
    title: {
      marginBottom: 10,
      textAlign: "left",
      fontWeight: "500",
      letterSpacing: -1,
      color: theme.colors.profileSection,
    },
    dividerStyle: {
      color: theme.colors.divider,
    },

    listItem: {
      marginBottom: 2,
    },
    preferences: {
      marginTop: 20,
    },
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
