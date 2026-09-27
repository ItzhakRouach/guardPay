import * as Notifications from "expo-notifications";
import i18n from "../translations/il18n";

// One stable identifier for the reminder so a re-save replaces it. The
// weekly reminder is the ONLY notification GuardPay schedules, and reminders
// created before this id existed carry auto-generated ids — so cancelling
// means "every scheduled notification of this app", not just the stable id.
export const WEEKLY_REMINDER_ID = "guardpay-weekly-reminder";

/**
 * Schedules (or replaces) the weekly reminder.
 * @returns {Promise<"scheduled"|"denied">}
 */
export const scheduleWeeklyReminder = async (day, hour, minute) => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return "denied";

  await cancelWeeklyReminder();
  await Notifications.scheduleNotificationAsync({
    identifier: WEEKLY_REMINDER_ID,
    content: {
      title: i18n.t("weekly_reminder.notif_title"),
      body: i18n.t("weekly_reminder.notif_body"),
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: day,
      hour,
      minute,
    },
  });
  return "scheduled";
};

export const cancelWeeklyReminder = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.log("[reminder] cancel failed:", e?.message);
  }
};
