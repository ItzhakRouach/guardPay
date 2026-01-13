import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { Query } from "react-native-appwrite";
import { ActivityIndicator, Text, useTheme } from "react-native-paper";
import {
  client,
  DATABASE_ID,
  databases,
  USERS_PREFS,
} from "../../lib/appwrite";
import { useAuth } from "../../lib/auth-context";
import { useLanguage } from "../../lib/lang-context";
import { scheduleWeeklyReminder } from "../../lib/notfication";
import ProfileSummary from "../components/layout/ProfileSummary";

export default function Index() {
  // use the allready defined functions and states
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const { isRTL } = useLanguage();

  const theme = useTheme();
  const styles = makeStyle(theme, isRTL);

  const getDayName = (dayNum) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days[dayNum - 1] || "Set Day";
  };

  const toggleReminder = async (isEnabled) => {
    try {
      setProfile((prev) => ({ ...prev, reminder_enable: isEnabled }));
      await databases.updateDocument(DATABASE_ID, USERS_PREFS, profile.$id, {
        reminder_enable: isEnabled,
      });

      if (!isEnabled) {
        await Notifications.cancelAllScheduledNotificationsAsync();
      } else {
        if (profile.reminder_day && profile.reminder_time) {
          const [hour, minute] = profile.reminder_time.split(":").map(Number);
          await scheduleWeeklyReminder(profile.reminder_day, hour, minute);
        }
      }
    } catch (error) {
      setProfile((prev) => ({ ...prev, reminder_enable: !isEnabled }));
      console.error("Failed to toggle reminder:", error);
    }
  };

  const fetchUserProfile = useCallback(async (user) => {
    if (!user) return;
    try {
      const response = await databases.listDocuments(DATABASE_ID, USERS_PREFS, [
        Query.equal("user_id", user.$id),
      ]);
      if (response.documents.length > 0) {
        setProfile(response.documents[0]);
        setLoading(false);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.log(err);
      setProfile(null);
    }
  }, []);

  // fetch user info
  useEffect(() => {
    fetchUserProfile(user);
    const channel = `databases.${DATABASE_ID}.collections.${USERS_PREFS}.documents`;
    const unsubcribe = client.subscribe(channel, (response) => {
      const isUpdate = response.events.some((e) => e.includes(".update"));
      const isMyDoc = response.payload.user_id === user?.$id;
      if (isMyDoc || isUpdate) {
        fetchUserProfile(user);
      }
    });
    return () => unsubcribe();
  }, [user, fetchUserProfile]);

  const onUpdateReminder = async (day, time) => {
    try {
      setProfile((prev) => ({
        ...prev,
        reminder_day: day,
        reminder_time: time,
        reminder_enable: true,
      }));
      await databases.updateDocument(DATABASE_ID, USERS_PREFS, profile.$id, {
        reminder_day: day,
        reminder_time: time,
        reminder_enable: true,
      });

      const [hour, minute] = time.split(":").map(Number);
      await scheduleWeeklyReminder(day, hour, minute);

      Alert.alert(
        "Success",
        `Reminder set for every ${getDayName(day)} at ${time}`
      );
    } catch (error) {
      console.error("Failed to update reminder:", error);
      Alert.alert("Error", "Could not save your reminder settings.");
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator style={styles.loadingProfile} size="large" />
      ) : (
        <>
          <View style={styles.headerWrapper}>
            <Text variant="headlineLarge" style={styles.userName}>
              {profile.user_name}
            </Text>
          </View>
          <ScrollView
            snapToInterval={100}
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: 300 },
            ]}
          >
            <ProfileSummary
              profile={profile}
              user={user}
              signout={signOut}
              onUpdateReminder={onUpdateReminder}
              toggleReminder={toggleReminder}
            />
          </ScrollView>
        </>
      )}
    </View>
  );
}

// styles for the entier screen
const makeStyle = (theme, isRTL) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 5,
      backgroundColor: theme.colors.background,
    },

    loadingProfile: {
      alignSelf: "center",
      marginTop: "auto",
      marginBottom: "auto",
    },
    headerWrapper: {
      flexDirection: isRTL ? "row-reverse" : "row",
      paddingEnd: isRTL ? 20 : 0,
      marginTop: 100,
      marginBottom: 20,
      marginLeft: 22,
    },
    userName: {
      color: theme.colors.primary,
      fontWeight: 500,
      letterSpacing: -1,
      marginTop: 15,
      paddingStart: 10,
    },
    scrollContent: { padding: 10, paddingHorizontal: 0 },
  });
