import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet, View } from "react-native";
import {
  Divider,
  IconButton,
  List,
  Modal,
  Portal,
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

// Modal launched from the Preferences row. Lists the 4 shift types with
// their current swatch dot; tapping a row opens the swatch picker modal
// (nested). A Reset row at the bottom restores the defaults.
//
// Persistence and dot rendering are identical to what AppearanceSection
// did before — this just relocates the UI into a modal so the section
// can collapse to a single row inside Preferences.
export default function ShiftColorsSettingsModal({ visible, onDismiss }) {
  const theme = useTheme();
  const { isRTL } = useLanguage();
  const { user, profile, fetchUserProfile } = useAuth();
  const { scheme } = useThemeMode();
  const { t } = useTranslation();
  const styles = makeStyle(theme, isRTL);

  const colors = parseUserColors(profile?.shift_colors);
  const [openFor, setOpenFor] = useState(null);

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
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.header}>
          <Text variant="titleLarge" style={styles.title}>
            {t("appearance.title")}
          </Text>
          <IconButton
            icon="close"
            size={22}
            onPress={onDismiss}
            accessibilityLabel={t("common.cancel")}
          />
        </View>

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
              <List.Icon {...props} icon="refresh" color={theme.colors.error} />
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
      paddingTop: 8,
      paddingBottom: 12,
      overflow: "hidden",
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
    listItem: {
      flex: 1,
      paddingHorizontal: 15,
      paddingVertical: 12,
    },
    listTitle: {
      textAlign: isRTL ? "right" : "left",
      writingDirection: isRTL ? "rtl" : "ltr",
      fontSize: 18,
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
