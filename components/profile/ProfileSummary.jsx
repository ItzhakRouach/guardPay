import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet } from "react-native";
import {
  ActivityIndicator,
  Divider,
  List,
  Portal,
  Surface,
  Switch,
  Text,
  useTheme,
} from "react-native-paper";
import { useLanguage } from "../../hooks/lang-context";
import { functions } from "../../lib/appwrite";
import { formatDates } from "../../lib/utils";
import WeeklyReminder from "../layout/WeeklyReminder";
import SecurityLawPDF from "../legal/SecurityLawPDF";
import PreferencesChange from "../profile/PreferencesChange";
import LanguagesChange from "./LanguagesChange";

export default function ProfileSummary({
  profile,
  user,
  signout,
  onUpdateReminder,
  toggleReminder,
}) {
  const [visable, setVisable] = useState(false);
  const [visableLang, setVisableLang] = useState(false);
  const [visablePref, setVisablePref] = useState(false);
  const [visablePDF, setVisablePDF] = useState(false);
  const [tempDay, setTempDay] = useState(profile?.reminder_day || 1);
  const [tempTime, setTempTime] = useState(new Date());
  const [isSwitchOn, setIsSwitchOn] = useState(
    profile?.reminder_enable || false,
  );
  const [loading, setLoading] = useState(false);

  const { isRTL, changeLanguage, lang } = useLanguage();

  const { t } = useTranslation();

  const showModal = () => setVisable(true);
  const hideModal = () => setVisable(false);
  const showLang = () => setVisableLang(true);
  const hideLang = () => setVisableLang(false);
  const showPref = () => setVisablePref(true);
  const hidePref = () => setVisablePref(false);
  const showPDF = () => setVisablePDF(true);
  const hidePDF = () => setVisablePDF(false);

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

  const handleDeleteAccount = (user) => {
    Alert.alert(
      t("settings.delete_title"),
      t("settings.delete_message"),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            const userId = user.$id || user.id;
            try {
              const execution = await functions.createExecution(
                "696dacb9001aaac9ee09",
                JSON.stringify({
                  userId: userId,
                }),
                false,
                "/",
                "POST",
              );
              Alert.alert(t("settings.deleted"), t("settings.success"), [
                {
                  text: "OK",
                },
              ]);
            } catch (e) {
              console.log(e);
            }
            try {
              signout();
            } catch (err) {
              console.log(err);
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  const theme = useTheme();
  const styles = makeStyle(theme, isRTL);

  if (!user) return null;

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
      <LanguagesChange
        visable={visableLang}
        hideModal={hideLang}
        lang={lang}
        setLang={changeLanguage}
      />
      <SecurityLawPDF visable={visablePDF} hideModal={hidePDF} />
      <PreferencesChange visable={visablePref} hideModal={hidePref} />

      <Surface style={styles.contentWrapper} elevation={1}>
        <Text style={styles.title} variant="headlineMedium">
          {t("index.general")}
        </Text>
        <List.Item
          style={styles.listItem}
          titleStyle={styles.listTitle}
          left={(props) => <List.Icon {...props} icon="email" />}
          title={`${user?.email || ""}`}
        />
        <Divider style={styles.dividerStyle} bold={false} />
        <List.Item
          style={styles.listItem}
          titleStyle={styles.listTitle}
          left={(props) => <List.Icon {...props} icon="account-outline" />}
          title={`${profile?.user_name}`}
        />
        <Divider style={styles.dividerStyle} bold={false} />
        <List.Item
          style={styles.listItem}
          titleStyle={styles.listTitle}
          left={(props) => <List.Icon {...props} icon="numeric" />}
          title={`${profile?.age}`}
        />
        <Divider style={styles.dividerStyle} bold={false} />
        <List.Item
          style={styles.listItem}
          titleStyle={styles.listTitle}
          left={(props) => (
            <List.Icon {...props} icon="calendar-account-outline" />
          )}
          title={`${formatDates(profile?.birth_date)}`}
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

        <List.Item
          style={styles.listItem}
          titleStyle={styles.listTitle}
          left={(props) => <List.Icon {...props} icon="cash-clock" />}
          title={`${t("index.hour_rate")}  ${profile?.price_per_hour} ₪`}
        />
        <Divider style={styles.dividerStyle} bold={false} />
        <List.Item
          style={styles.listItem}
          titleStyle={styles.listTitle}
          left={(props) => <List.Icon {...props} icon="car" />}
          title={`${t("index.ride_rate")}  ${profile?.price_per_ride} ₪`}
        />
        <Divider style={styles.dividerStyle} bold={false} />
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
            `days.${getDayName(profile?.reminder_day)}`,
          )} ${t("index.at")} ${profile?.reminder_time || t("index.not_set")}`}
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
        <Divider style={styles.dividerStyle} bold={false} />
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
        <Divider style={styles.dividerStyle} bold={false} />
        <List.Item
          style={styles.listItem}
          titleStyle={styles.listTitle}
          descriptionStyle={styles.descStyle}
          left={(props) => (
            <List.Icon {...props} icon="gavel" color={theme.colors.primary} />
          )}
          title={t("index.security_law")}
          description={t("index.security_law_desc")}
          onPress={showPDF}
        />
        <List.Item
          style={styles.listItem}
          titleStyle={styles.listTitle}
          left={(props) => (
            <List.Icon {...props} icon="account-remove" color="#E94560" />
          )}
          title={t("index.delete_account")}
          onPress={() => handleDeleteAccount(user)}
        />
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
      <Portal>
        {loading && (
          <Surface style={styles.loadingOverlay} elevation={0}>
            <ActivityIndicator
              animating={true}
              color={theme.colors.primary}
              size={80}
            />
          </Surface>
        )}
      </Portal>
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
      backgroundColor: theme.colors.divider,
      marginVertical: 10,
      width: "100%",
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
    loadingOverlay: {
      flex: 1,
      backgroundColor: theme.colors.background,
      opacity: 0.7,
      justifyContent: "center",
      alignItems: "center",
    },
  });
