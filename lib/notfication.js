import * as Notifications from "expo-notifications";

export const scheduleWeeklyReminder = async (day, hour, minute) => {
  //asking premission from user device
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") {
    alert("Need to enable in order to get weekly notfication");
    return;
  }
  // cancel any previous notfication
  await Notifications.cancelAllScheduledNotificationsAsync();

  // set the notfication
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "GuardPay: Weekly Reminder",
      body: "Dont forget to registe all your weekly shifts!",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: day,
      hour: hour,
      minute: minute,
      repeats: true,
    },
  });
};
