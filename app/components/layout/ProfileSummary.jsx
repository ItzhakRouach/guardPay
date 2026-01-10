import { useState } from "react";
import { StyleSheet } from "react-native";
import {
  Divider,
  List,
  Surface,
  Switch,
  Text,
  useTheme,
} from "react-native-paper";
import { formatDates } from "../../../lib/utils";
import WeeklyReminder from "./WekklyReminder";

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
      <WeeklyReminder
        handleSaveReminder={handleSaveReminder}
        visable={visable}
        hideModal={hideModal}
        tempDay={tempDay}
        tempTime={tempTime}
        setTempTime={setTempTime}
        setTempDay={setTempDay}
      />
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
  });
