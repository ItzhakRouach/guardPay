import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet, View } from "react-native";
import {
  Divider,
  IconButton,
  Modal,
  Portal,
  Text,
  TouchableRipple,
  useTheme,
} from "react-native-paper";
import { useAuth } from "../../hooks/auth-context";
import { useLanguage } from "../../hooks/lang-context";
import { DATABASE_ID, USERS_PREFS, databases } from "../../lib/appwrite";
import {
  CUSTOMISABLE_TYPES,
  DEFAULT_SHIFT_TIMES,
  formatTimeRange,
  parseUserShiftTimes,
  serialiseUserShiftTimes,
} from "../../lib/shiftTimes";
import ShiftTimeEditModal from "./ShiftTimeEditModal";

const ICONS = {
  morning: "weather-sunset-up",
  evening: "weather-sunset-down",
  night: "weather-night",
};

// Modal launched from the Preferences "Default shift times" row. Lists
// morning / evening / night with their current time range; tapping a
// row opens the time editor sub-modal. Reset row at the bottom
// restores all three to app defaults.
export default function ShiftTimesSettingsModal({ visible, onDismiss }) {
  const theme = useTheme();
  const { isRTL } = useLanguage();
  const { user, profile, fetchUserProfile } = useAuth();
  const { t } = useTranslation();
  const styles = makeStyle(theme, isRTL);

  const times = parseUserShiftTimes(profile?.default_shift_times);
  const [openFor, setOpenFor] = useState(null);

  const persist = async (nextTimes, { explicit = false } = {}) => {
    if (!profile?.$id) return;
    try {
      await databases.updateDocument(DATABASE_ID, USERS_PREFS, profile.$id, {
        default_shift_times: explicit
          ? JSON.stringify(nextTimes)
          : serialiseUserShiftTimes(nextTimes),
      });
      await fetchUserProfile(user);
    } catch (err) {
      console.log("Failed to update default shift times:", err);
    }
  };

  const updateOne = (type) => (next) =>
    persist({ ...times, [type]: next });

  const onReset = () => {
    Alert.alert(
      t("shift_times.reset_confirm_title"),
      t("shift_times.reset_confirm_body"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("shift_times.reset"),
          style: "destructive",
          onPress: () =>
            persist({ ...DEFAULT_SHIFT_TIMES }, { explicit: true }),
        },
      ],
    );
  };

  const Row = ({ type }) => (
    <TouchableRipple onPress={() => setOpenFor(type)}>
      <View style={styles.row}>
        <IconButton
          icon={ICONS[type]}
          size={22}
          iconColor={theme.colors.primary}
          style={styles.rowIcon}
        />
        <Text variant="bodyLarge" style={styles.rowLabel} numberOfLines={1}>
          {t(`shift_type.${type}`)}
        </Text>
        <Text variant="bodyMedium" style={styles.rowValue}>
          {formatTimeRange(times[type])}
        </Text>
      </View>
    </TouchableRipple>
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.clipWrap}>
          <View style={styles.header}>
            <Text variant="titleLarge" style={styles.title}>
              {t("shift_times.title")}
            </Text>
            <IconButton
              icon="close"
              size={22}
              onPress={onDismiss}
              accessibilityLabel={t("common.cancel")}
            />
          </View>

          {CUSTOMISABLE_TYPES.map((type, idx) => (
            <View key={type}>
              <Row type={type} />
              {idx < CUSTOMISABLE_TYPES.length - 1 && (
                <Divider style={styles.dividerStyle} bold={false} />
              )}
            </View>
          ))}

          <Divider style={styles.dividerStyle} bold={false} />
          <TouchableRipple onPress={onReset}>
            <View style={styles.row}>
              <IconButton
                icon="refresh"
                size={22}
                iconColor={theme.colors.error}
                style={styles.rowIcon}
              />
              <Text
                variant="bodyLarge"
                style={[styles.rowLabel, { color: theme.colors.error }]}
                numberOfLines={1}
              >
                {t("shift_times.reset")}
              </Text>
            </View>
          </TouchableRipple>
        </View>

        <ShiftTimeEditModal
          visible={openFor !== null}
          onDismiss={() => setOpenFor(null)}
          title={openFor ? t(`shift_type.${openFor}`) : undefined}
          currentTimes={openFor ? times[openFor] : undefined}
          onSave={openFor ? updateOne(openFor) : () => {}}
        />
      </Modal>
    </Portal>
  );
}

const makeStyle = (theme, isRTL) =>
  StyleSheet.create({
    modalContainer: {
      backgroundColor: theme.colors.surface,
      margin: 20,
      borderRadius: 28,
    },
    clipWrap: {
      borderRadius: 28,
      overflow: "hidden",
      paddingTop: 8,
      paddingBottom: 8,
    },
    header: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 18,
      paddingTop: 6,
      paddingBottom: 4,
    },
    title: {
      fontWeight: "bold",
      color: theme.colors.profileSection,
    },
    dividerStyle: {
      backgroundColor: theme.colors.divider,
      marginVertical: 1,
      width: "100%",
    },
    row: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 8,
      minHeight: 56,
    },
    rowIcon: {
      margin: 0,
    },
    rowLabel: {
      flex: 1,
      color: theme.colors.onSurface,
      fontSize: 18,
      textAlign: isRTL ? "right" : "left",
      writingDirection: isRTL ? "rtl" : "ltr",
      paddingHorizontal: 4,
    },
    rowValue: {
      color: theme.colors.summary,
      fontSize: 16,
      marginHorizontal: 12,
    },
  });
