import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Linking, Pressable, ScrollView, Switch, View } from "react-native";
import { Query } from "react-native-appwrite";
import { ActivityIndicator, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { OutlinedButton } from "../../components/common/Buttons";
import Eyebrow from "../../components/common/Eyebrow";
import Hairline from "../../components/common/Hairline";
import Icon from "../../components/common/Icon";
import Pill from "../../components/common/Pill";
import Type from "../../components/common/Type";
import WeeklyReminder from "../../components/layout/WeeklyReminder";
import SecurityLawPDF from "../../components/legal/SecurityLawPDF";
import LanguagesChange from "../../components/profile/LanguagesChange";
import PreferencesChange from "../../components/profile/PreferencesChange";
import ShiftColorsSettingsModal from "../../components/profile/ShiftColorsSettingsModal";
import ShiftTimesSettingsModal from "../../components/profile/ShiftTimesSettingsModal";
import { useAuth } from "../../hooks/auth-context";
import { useLanguage } from "../../hooks/lang-context";
import { useProfileStats } from "../../hooks/useProfileStats";
import { useThemeMode } from "../../hooks/theme-context";
import {
  client,
  DATABASE_ID,
  databases,
  functions,
  USERS_PREFS,
} from "../../lib/appwrite";
import { scheduleWeeklyReminder } from "../../lib/notfication";

function SettingsRow({ icon, label, value, onPress, right, last, isRTL, tall }) {
  const theme = useTheme();
  const chevName = isRTL ? "chev-left" : "chev-right";
  const iconSpacing = isRTL ? { marginLeft: 12 } : { marginRight: 12 };
  const labelAlign = isRTL ? "right" : "left";
  const body = (
    <View
      style={{
        flexDirection: isRTL ? "row-reverse" : "row",
        alignItems: "center",
        paddingVertical: tall ? 18 : 14,
        paddingHorizontal: 18,
      }}
    >
      {icon ? (
        <View
          style={[
            {
              width: 36,
              height: 36,
              borderRadius: 11,
              backgroundColor: theme.colors.accentSoft,
              justifyContent: "center",
              alignItems: "center",
            },
            iconSpacing,
          ]}
        >
          <Icon name={icon} size={18} color={theme.colors.accent} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Type
          variant="body"
          color={theme.colors.ink}
          style={{ textAlign: labelAlign }}
        >
          {label}
        </Type>
        {value ? (
          <Type
            variant="small"
            color={theme.colors.muted}
            style={{ marginTop: 2, textAlign: labelAlign }}
          >
            {value}
          </Type>
        ) : null}
      </View>
      {right ||
        (onPress ? (
          <Icon name={chevName} size={18} color={theme.colors.muted} />
        ) : null)}
    </View>
  );
  return (
    <View>
      {onPress ? (
        <Pressable
          onPress={onPress}
          android_ripple={{ color: theme.colors.surfaceAlt }}
          style={({ pressed }) => ({
            backgroundColor: pressed ? theme.colors.surfaceAlt : "transparent",
          })}
        >
          {body}
        </Pressable>
      ) : (
        body
      )}
      {!last ? <Hairline soft /> : null}
    </View>
  );
}

function StatsTile({ label, value, align = "left" }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 18,
        alignItems: align === "right" ? "flex-end" : "flex-start",
      }}
    >
      <Eyebrow color={theme.colors.muted}>{label}</Eyebrow>
      <Type
        variant="statValue"
        color={theme.colors.ink}
        style={{ marginTop: 6 }}
      >
        {value}
      </Type>
    </View>
  );
}

const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export default function ProfileScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { lang, changeLanguage, isRTL } = useLanguage();
  const { scheme, toggle } = useThemeMode();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sub-screen modal toggles — wired one-to-one with the legacy ProfileSummary.
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [colorsOpen, setColorsOpen] = useState(false);
  const [timesOpen, setTimesOpen] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);

  const [tempDay, setTempDay] = useState(1);
  const [tempTime, setTempTime] = useState(new Date());

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const res = await databases.listDocuments(DATABASE_ID, USERS_PREFS, [
        Query.equal("user_id", user.$id),
      ]);
      const doc = res.documents[0] || null;
      setProfile(doc);
      if (doc?.reminder_day) setTempDay(doc.reminder_day);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
    if (!user) return;
    const channel = `databases.${DATABASE_ID}.collections.${USERS_PREFS}.documents`;
    let unsub;
    try {
      unsub = client.subscribe(channel, (response) => {
        if (response.payload?.user_id === user.$id) {
          fetchProfile();
        }
      });
    } catch {}
    return () => {
      try {
        unsub?.();
      } catch {}
    };
  }, [user, fetchProfile]);

  const { totalShifts, activeMonths } = useProfileStats(user);

  const onToggleReminder = async (value) => {
    if (!profile) return;
    try {
      setProfile((p) => ({ ...p, reminder_enable: value }));
      await databases.updateDocument(DATABASE_ID, USERS_PREFS, profile.$id, {
        reminder_enable: value,
      });
      if (!value) {
        await Notifications.cancelAllScheduledNotificationsAsync();
      } else if (profile.reminder_day && profile.reminder_time) {
        const [h, m] = profile.reminder_time.split(":").map(Number);
        await scheduleWeeklyReminder(profile.reminder_day, h, m);
      }
    } catch (err) {
      console.log(err);
      setProfile((p) => ({ ...p, reminder_enable: !value }));
    }
  };

  const onSaveReminder = async () => {
    const timeString = tempTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    try {
      setProfile((p) => ({
        ...p,
        reminder_day: tempDay,
        reminder_time: timeString,
        reminder_enable: true,
      }));
      await databases.updateDocument(DATABASE_ID, USERS_PREFS, profile.$id, {
        reminder_day: tempDay,
        reminder_time: timeString,
        reminder_enable: true,
      });
      const [h, m] = timeString.split(":").map(Number);
      await scheduleWeeklyReminder(tempDay, h, m);
      setReminderOpen(false);
    } catch (err) {
      console.log(err);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(t("settings.delete_title"), t("settings.delete_message"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await functions.createExecution(
              "697d0f3c001bba7f03d2",
              JSON.stringify({ action: "DELETE_ACCOUNT" }),
              false,
              "/",
              "POST",
            );
            Alert.alert(t("settings.deleted"), t("settings.success"));
          } catch (e) {
            console.log(e);
          }
          try {
            signOut();
          } catch (err) {
            console.log(err);
          }
        },
      },
    ]);
  };

  const reminderValue = useMemo(() => {
    if (!profile?.reminder_enable) return t("common.off");
    const dayKey = dayNames[(profile.reminder_day || 1) - 1];
    const day = t(`days.${dayKey}`);
    return `${t("index.every")} ${day} ${t("index.at")} ${profile.reminder_time || ""}`.trim();
  }, [profile, t]);

  const confirmSignOut = () => {
    Alert.alert(t("profile.signOut"), t("profile.signOutConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("profile.signOut"), style: "destructive", onPress: signOut },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator color={theme.colors.accent} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: insets.top + 8,
            paddingBottom: 140,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Eyebrow color={theme.colors.muted}>{t("profile.eyebrow")}</Eyebrow>
          <Type
            variant="h1"
            color={theme.colors.ink}
            style={{ marginTop: 6 }}
            numberOfLines={1}
          >
            {profile?.user_name || "—"}
          </Type>
          {user?.email ? (
            <Type
              variant="body"
              color={theme.colors.muted}
              style={{ marginTop: 4 }}
            >
              {user.email}
            </Type>
          ) : null}

          {/* Stats: lifetime numbers from useProfileStats. */}
          <View
            style={{
              marginTop: 22,
              borderRadius: 18,
              backgroundColor: theme.colors.surface,
              borderWidth: 1,
              borderColor: theme.colors.border,
              overflow: "hidden",
              flexDirection: isRTL ? "row-reverse" : "row",
            }}
          >
            <StatsTile
              label={t("profile.totalShifts")}
              value={totalShifts == null ? "—" : String(totalShifts)}
              align={isRTL ? "right" : "left"}
            />
            <Hairline vertical />
            <StatsTile
              label={t("profile.activeMonths")}
              value={activeMonths == null ? "—" : String(activeMonths)}
              align={isRTL ? "right" : "left"}
            />
          </View>

          {/* Preferences */}
          <View style={{ height: 24 }} />
          <Eyebrow color={theme.colors.muted}>{t("index.pref")}</Eyebrow>
          <View
            style={{
              marginTop: 10,
              borderRadius: 18,
              backgroundColor: theme.colors.surface,
              borderWidth: 1,
              borderColor: theme.colors.border,
              overflow: "hidden",
            }}
          >
            <SettingsRow
              isRTL={isRTL}
              icon="tag"
              label={t("index.hour_rate")}
              value={`${profile?.price_per_hour ?? "—"} ₪/h`}
              onPress={() => setPrefsOpen(true)}
            />
            <SettingsRow
              isRTL={isRTL}
              icon="tag"
              label={t("index.ride_rate")}
              value={`${profile?.price_per_ride ?? "—"} ₪`}
              onPress={() => setPrefsOpen(true)}
            />
            <SettingsRow
              isRTL={isRTL}
              icon="sun"
              label={t("index.shift_colors")}
              onPress={() => setColorsOpen(true)}
            />
            <SettingsRow
              isRTL={isRTL}
              icon="clock"
              label={t("index.shift_times")}
              onPress={() => setTimesOpen(true)}
              last
            />
          </View>

          {/* Reminders + appearance + language */}
          <View style={{ height: 24 }} />
          <Eyebrow color={theme.colors.muted}>{t("profile.settings")}</Eyebrow>
          <View
            style={{
              marginTop: 10,
              borderRadius: 18,
              backgroundColor: theme.colors.surface,
              borderWidth: 1,
              borderColor: theme.colors.border,
              overflow: "hidden",
            }}
          >
            <SettingsRow
              isRTL={isRTL}
              tall
              icon="bell"
              label={t("index.weekly_r")}
              value={reminderValue}
              onPress={() => setReminderOpen(true)}
              right={
                <Switch
                  value={!!profile?.reminder_enable}
                  onValueChange={onToggleReminder}
                  trackColor={{
                    true: theme.colors.accent,
                    false: theme.colors.divider,
                  }}
                  thumbColor="#FFFFFF"
                />
              }
            />
            <SettingsRow
              isRTL={isRTL}
              tall
              icon="moon"
              label={t("profile.darkMode")}
              right={
                <Switch
                  value={scheme === "dark"}
                  onValueChange={toggle}
                  trackColor={{
                    true: theme.colors.accent,
                    false: theme.colors.divider,
                  }}
                  thumbColor="#FFFFFF"
                />
              }
            />
            <SettingsRow
              isRTL={isRTL}
              tall
              icon="user"
              label={t("profile.language")}
              right={
                <Pill
                  value={lang}
                  options={[
                    { label: "EN", value: "en" },
                    { label: "HE", value: "he" },
                  ]}
                  onChange={(v) => changeLanguage(v)}
                />
              }
              last
            />
          </View>

          {/* Account / legal */}
          <View style={{ height: 24 }} />
          <Eyebrow color={theme.colors.muted}>{t("index.account")}</Eyebrow>
          <View
            style={{
              marginTop: 10,
              borderRadius: 18,
              backgroundColor: theme.colors.surface,
              borderWidth: 1,
              borderColor: theme.colors.border,
              overflow: "hidden",
            }}
          >
            <SettingsRow
              isRTL={isRTL}
              icon="shield"
              label={t("index.security_law")}
              value={t("index.security_law_desc")}
              onPress={() => setPdfOpen(true)}
            />
            <SettingsRow
              isRTL={isRTL}
              icon="lock"
              label={t("index.privacy")}
              onPress={() =>
                Linking.openURL(
                  "https://guardpay.example.com/privacy",
                ).catch(() => {})
              }
            />
            <SettingsRow
              isRTL={isRTL}
              icon="trash"
              label={t("index.delete_account")}
              onPress={handleDeleteAccount}
              last
            />
          </View>

          <View style={{ height: 24 }} />
          <OutlinedButton
            label={t("profile.signOut")}
            icon="arrow-right"
            onPress={confirmSignOut}
            tone="neg"
          />
        </ScrollView>
      )}

      {prefsOpen ? (
        <PreferencesChange
          visable={prefsOpen}
          hideModal={() => setPrefsOpen(false)}
        />
      ) : null}
      {langOpen ? (
        <LanguagesChange
          visable={langOpen}
          hideModal={() => setLangOpen(false)}
        />
      ) : null}
      <ShiftColorsSettingsModal
        visible={colorsOpen}
        onDismiss={() => setColorsOpen(false)}
      />
      <ShiftTimesSettingsModal
        visible={timesOpen}
        onDismiss={() => setTimesOpen(false)}
      />
      {pdfOpen ? (
        <SecurityLawPDF
          visable={pdfOpen}
          hideModal={() => setPdfOpen(false)}
        />
      ) : null}
      {reminderOpen ? (
        <WeeklyReminder
          visable={reminderOpen}
          hideModal={() => setReminderOpen(false)}
          tempDay={tempDay}
          tempTime={tempTime}
          setTempTime={setTempTime}
          setTempDay={setTempDay}
          handleSaveReminder={onSaveReminder}
        />
      ) : null}
    </View>
  );
}
