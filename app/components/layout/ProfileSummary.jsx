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
import { useTranslation } from "react-i18next";
import LanguegesChange from "../LanguegesChange";
import { useLanguage } from "../../../lib/lang-context";
import PreferencesChange from "../PreferncesChange";

export default function ProfileSummary({
  profile,
  user,
  signout,
  handleEditBtn,
  onUpdateReminder,
  toggleReminder,
}) {
  const [visable, setVisable] = useState(false);
  const [visableLang, setVisableLang] = useState(false);
  const [visablePref, setVisablePref] = useState(false);
  const [tempDay, setTempDay] = useState(profile.reminder_day || 1);
  const [tempTime, setTempTime] = useState(new Date());
  const [isSwitchOn, setIsSwitchOn] = useState(
    profile.reminder_enable || false
  );

  const { isRTL, changeLanguage, lang } = useLanguage();

  const { t } = useTranslation();

  const showModal = () => setVisable(true);
  const hideModal = () => setVisable(false);
  const showLang = () => setVisableLang(true);
  const hideLang = () => setVisableLang(false);
  const showPref = () => setVisablePref(true);
  const hidePref = () => setVisablePref(false);

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
    const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    return days[dayNum - 1] || "Set Day";
  };

  const theme = useTheme();
  const styles = makeStyle(theme, isRTL);

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
      <LanguegesChange
        visable={visableLang}
        hideModal={hideLang}
        lang={lang}
        setLang={changeLanguage}
      />
      <PreferencesChange visable={visablePref} hideModal={hidePref} />
      <Surface style={styles.contentWrapper} elevation={1}>
        <Text style={styles.title} variant="headlineMedium">
          {t("index.general")}
        </Text>
        <List.Item
          style={styles.listItem}
          titleStyle={styles.listTitle}
          left={(props) => <List.Icon {...props} icon="email" />}
          title={`${t("index.email")} : ${user.email}`}
        />
        <Divider style={styles.dividerStyle} bold={true} />
        <List.Item
          style={styles.listItem}
          titleStyle={styles.listTitle}
          left={(props) => <List.Icon {...props} icon="account-outline" />}
          title={`${t("index.name")} : ${profile.user_name}`}
        />
        <Divider style={styles.dividerStyle} bold={true} />
        <List.Item
          style={styles.listItem}
          titleStyle={styles.listTitle}
          left={(props) => <List.Icon {...props} icon="numeric" />}
          title={`${t("index.age")} : ${profile.age}`}
        />
        <Divider style={styles.dividerStyle} bold={true} />
        <List.Item
          style={styles.listItem}
          titleStyle={styles.listTitle}
          left={(props) => (
            <List.Icon {...props} icon="calendar-account-outline" />
          )}
          title={`${t("index.birth_date")} : ${formatDates(
            profile.birth_date
          )}`}
        />
      </Surface>
      {/**Preferences Section */}
      <Surface
        style={[styles.contentWrapper, styles.preferences]}
        elevation={1}
      >
        <Text style={styles.title} variant="headlineMedium">
          {t("index.pref")}
        </Text>

        <Divider style={styles.dividerStyle} bold={true} />
        <List.Item
          style={styles.listItem}
          titleStyle={styles.listTitle}
          left={(props) => <List.Icon {...props} icon="cash-clock" />}
          title={`${t("index.hour_rate")} : ${profile.price_per_hour}`}
        />
        <Divider style={styles.dividerStyle} bold={true} />
        <List.Item
          style={styles.listItem}
          titleStyle={styles.listTitle}
          left={(props) => <List.Icon {...props} icon="cash-fast" />}
          title={`${t("index.ride_rate")} : ${profile.price_per_ride}`}
        />
        <Divider style={styles.dividerStyle} bold={true} />
        <List.Item
          style={styles.listItem}
          titleStyle={styles.listTitle}
          left={
            isRTL
              ? (props) => (
                  <Switch value={isSwitchOn} onValueChange={onToggleSwitch} />
                )
              : (props) => <List.Icon {...props} icon="alarm" />
          }
          right={
            isRTL
              ? ""
              : (props) => (
                  <Switch value={isSwitchOn} onValueChange={onToggleSwitch} />
                )
          }
          title={t("index.weekly_r")}
          onPress={showModal}
          description={`${t("index.every")} ${t(
            `days.${getDayName(profile.reminder_day)}`
          )} ${t("index.at")} ${profile.reminder_time || t("index.not_set")}`}
          descriptionStyle={styles.descStyle}
        />
      </Surface>
      {/**Account Section */}
      <Surface
        style={[styles.contentWrapper, styles.preferences]}
        elevation={1}
      >
        <Text style={styles.title} variant="headlineMedium">
          {t("index.account")}
        </Text>
        <Divider style={styles.dividerStyle} bold={true} />
        <List.Item
          style={styles.listItem}
          titleStyle={styles.listTitle}
          left={(props) => (
            <List.Icon
              {...props}
              icon="account-edit"
              color={theme.colors.primary}
            />
          )}
          title={t("index.edit_pref")}
          onPress={showPref}
        />
        <Divider style={styles.dividerStyle} bold={true} />
        <List.Item
          style={styles.listItem}
          titleStyle={styles.listTitle}
          left={(props) => (
            <List.Icon
              {...props}
              icon="translate"
              color={theme.colors.primary}
            />
          )}
          title={t("index.change_lang")}
          onPress={showLang}
        />
        <Divider style={styles.dividerStyle} bold={true} />
        <List.Item
          style={styles.listItem}
          titleStyle={styles.listTitle}
          left={(props) => (
            <List.Icon {...props} icon="logout" color="#E94560" />
          )}
          title={t("index.log_out")}
          onPress={signout}
        />
      </Surface>
    </>
  );
}

const makeStyle = (theme, isRTL) =>
  StyleSheet.create({
    contentWrapper: {
      padding: 15,
      marginTop: 5,
      borderRadius: 30,
      backgroundColor: theme.colors.surface,
      marginHorizontal: 10,
      alignItems: isRTL ? "flex-end" : "flex-start",
    },
    title: {
      marginBottom: 10,
      fontWeight: "500",
      paddingStart: 10,
      width: "100%",
      textAlign: isRTL ? "right" : "left",
      letterSpacing: -1,
      color: theme.colors.profileSection,
    },
    dividerStyle: {
      color: theme.colors.divider,
    },

    listItem: {
      marginBottom: 2,
    },
    listTitle: {
      textAlign: isRTL ? "right" : "left",
      writingDirection: isRTL ? "rtl" : "ltr",
      fontSize: 20,
    },
    preferences: {
      marginTop: 20,
    },
    descStyle: {
      textAlign: isRTL ? "right" : "left",
      marginTop: 5,
      writingDirection: isRTL ? "rtl" : "ltr",
      color: theme.colors.secondary,
    },
  });
