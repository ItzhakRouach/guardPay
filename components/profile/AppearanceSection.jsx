import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet, View } from "react-native";
import {
  Divider,
  List,
  Surface,
  Text,
  TouchableRipple,
  useTheme,
} from "react-native-paper";
import { useAuth } from "../../hooks/auth-context";
import { useLanguage } from "../../hooks/lang-context";
import { useThemeMode } from "../../hooks/theme-context";
import { DATABASE_ID, USERS_PREFS, databases } from "../../lib/appwrite";
import {
  DEFAULT_COLORS,
  parseUserColors,
  resolveSwatchHex,
  serialiseUserColors,
} from "../../lib/shiftColors";
import ShiftColorsModal from "./ShiftColorsModal";

// Profile section for choosing per-shift-type background tints. Persists
// changed swatches as a JSON blob in users_prefs.shift_colors. Mirrors the
// "General" / "Preferences" / "Account" card pattern in ProfileSummary so
// it feels native to the Profile tab.
export default function AppearanceSection() {
  const theme = useTheme();
  const { isRTL } = useLanguage();
  const { user, profile, fetchUserProfile } = useAuth();
  const { scheme } = useThemeMode();
  const { t } = useTranslation();
  const styles = makeStyle(theme, isRTL);

  const colors = parseUserColors(profile?.shift_colors);
  const [openFor, setOpenFor] = useState(null);

  // Write a colors object to Appwrite + refresh the auth-context profile.
  // When `explicit` is true, persist the full JSON instead of the collapsed
  // diff — used for reset so the document changes from "custom JSON" to
  // "defaults JSON" (rather than to "{}", which Appwrite/auth-context
  // sometimes wouldn't surface to the UI as a change).
  const persist = async (nextColors, { explicit = false } = {}) => {
    if (!profile?.$id) return;
    try {
      await databases.updateDocument(DATABASE_ID, USERS_PREFS, profile.$id, {
        shift_colors: explicit
          ? JSON.stringify(nextColors)
          : serialiseUserColors(nextColors),
      });
      await fetchUserProfile(user);
    } catch (err) {
      console.log("Failed to update shift colors:", err);
    }
  };

  const updateOne = (key) => (hex) => persist({ ...colors, [key]: hex });

  const onReset = () => {
    Alert.alert(
      t("appearance.reset_confirm_title"),
      t("appearance.reset_confirm_body"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("appearance.reset"),
          style: "destructive",
          onPress: () => persist({ ...DEFAULT_COLORS }, { explicit: true }),
        },
      ],
    );
  };

  const Row = ({ labelKey, colorKey, icon }) => (
    <TouchableRipple onPress={() => setOpenFor(colorKey)}>
      <List.Item
        style={styles.listItem}
        titleStyle={styles.listTitle}
        title={t(`appearance.${labelKey}`)}
        left={(props) => (
          <List.Icon {...props} icon={icon} color={theme.colors.primary} />
        )}
        right={() => (
          <View style={styles.dotWrap}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: resolveSwatchHex(colors[colorKey], scheme),
                },
              ]}
            />
          </View>
        )}
      />
    </TouchableRipple>
  );

  return (
    <Surface style={[styles.contentWrapper, styles.preferences]} elevation={0}>
      <Text style={styles.title} variant="headlineMedium">
        {t("appearance.title")}
      </Text>

      <Row labelKey="friday" colorKey="friday" icon="calendar-weekend-outline" />
      <Divider style={styles.dividerStyle} bold={false} />
      <Row labelKey="saturday" colorKey="saturday" icon="calendar-weekend" />
      <Divider style={styles.dividerStyle} bold={false} />
      <Row labelKey="training" colorKey="training" icon="karate" />
      <Divider style={styles.dividerStyle} bold={false} />
      <Row labelKey="holiday" colorKey="holiday" icon="calendar-star" />
      <Divider style={styles.dividerStyle} bold={false} />
      <TouchableRipple onPress={onReset}>
        <List.Item
          style={styles.listItem}
          titleStyle={[styles.listTitle, { color: theme.colors.error }]}
          title={t("appearance.reset")}
          left={(props) => (
            <List.Icon
              {...props}
              icon="refresh"
              color={theme.colors.error}
            />
          )}
        />
      </TouchableRipple>

      <ShiftColorsModal
        visible={openFor !== null}
        onDismiss={() => setOpenFor(null)}
        title={openFor ? t(`appearance.${openFor}`) : undefined}
        currentColor={openFor ? colors[openFor] : undefined}
        onSelect={openFor ? updateOne(openFor) : () => {}}
      />
    </Surface>
  );
}

const makeStyle = (theme, isRTL) =>
  StyleSheet.create({
    contentWrapper: {
      marginTop: 20,
      marginHorizontal: 10,
      borderRadius: 30,
      backgroundColor: theme.colors.surface,
    },
    preferences: {
      overflow: "hidden",
    },
    title: {
      flexDirection: isRTL ? "row-reverse" : "row",
      textAlign: isRTL ? "right" : "left",
      padding: 10,
      paddingEnd: isRTL ? 30 : 0,
      paddingStart: isRTL ? 0 : 30,
      marginBottom: 10,
      fontWeight: "500",
      width: "100%",
      letterSpacing: -1,
      color: theme.colors.profileSection,
    },
    dividerStyle: {
      backgroundColor: theme.colors.divider,
      marginVertical: 1,
      width: "100%",
    },
    listItem: {
      flex: 1,
      paddingHorizontal: 15,
      paddingVertical: 15,
    },
    listTitle: {
      textAlign: isRTL ? "right" : "left",
      writingDirection: isRTL ? "rtl" : "ltr",
      fontSize: 20,
    },
    dotWrap: {
      justifyContent: "center",
      paddingHorizontal: 6,
    },
    dot: {
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 1.5,
      borderColor: theme.colors.outlineVariant,
    },
  });
