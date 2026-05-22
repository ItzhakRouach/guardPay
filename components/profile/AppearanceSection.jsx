import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet, View } from "react-native";
import { Divider, List, Text, useTheme } from "react-native-paper";
import { useAuth } from "../../hooks/auth-context";
import { useLanguage } from "../../hooks/lang-context";
import { DATABASE_ID, USERS_PREFS, databases } from "../../lib/appwrite";
import {
  DEFAULT_COLORS,
  parseUserColors,
  serialiseUserColors,
} from "../../lib/shiftColors";
import ShiftColorsModal from "./ShiftColorsModal";

// Profile section for choosing the per-shift-type background tint. Persists
// the changed swatches as a JSON blob in users_prefs.shift_colors. Old
// profiles without the field fall back to DEFAULT_COLORS.
export default function AppearanceSection() {
  const theme = useTheme();
  const { isRTL } = useLanguage();
  const { user, profile, fetchUserProfile } = useAuth();
  const { t } = useTranslation();
  const styles = makeStyle(theme, isRTL);

  const colors = parseUserColors(profile?.shift_colors);
  const [openFor, setOpenFor] = useState(null);

  const persist = async (nextColors) => {
    if (!profile?.$id) return;
    try {
      await databases.updateDocument(DATABASE_ID, USERS_PREFS, profile.$id, {
        shift_colors: serialiseUserColors(nextColors),
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
          onPress: () => persist({ ...DEFAULT_COLORS }),
        },
      ],
    );
  };

  const Row = ({ labelKey, colorKey }) => (
    <List.Item
      title={t(`appearance.${labelKey}`)}
      titleStyle={styles.rowTitle}
      onPress={() => setOpenFor(colorKey)}
      right={() => (
        <View style={styles.dotWrap}>
          <View
            style={[styles.dot, { backgroundColor: colors[colorKey] }]}
          />
        </View>
      )}
    />
  );

  return (
    <View>
      <Text variant="titleMedium" style={styles.sectionHeader}>
        {t("appearance.title")}
      </Text>
      <Text variant="bodySmall" style={styles.subtitle}>
        {t("appearance.subtitle")}
      </Text>

      <List.Section>
        <Row labelKey="friday" colorKey="friday" />
        <Divider style={styles.divider} />
        <Row labelKey="saturday" colorKey="saturday" />
        <Divider style={styles.divider} />
        <Row labelKey="training" colorKey="training" />
        <Divider style={styles.divider} />
        <Row labelKey="holiday" colorKey="holiday" />
        <Divider style={styles.divider} />
        <List.Item
          title={t("appearance.reset")}
          titleStyle={[styles.rowTitle, { color: theme.colors.error }]}
          onPress={onReset}
        />
      </List.Section>

      <ShiftColorsModal
        visible={openFor !== null}
        onDismiss={() => setOpenFor(null)}
        title={openFor ? t(`appearance.${openFor}`) : undefined}
        currentColor={openFor ? colors[openFor] : undefined}
        onSelect={openFor ? updateOne(openFor) : () => {}}
      />
    </View>
  );
}

const makeStyle = (theme, isRTL) =>
  StyleSheet.create({
    sectionHeader: {
      fontWeight: "bold",
      color: theme.colors.profileSection,
      marginTop: 20,
      marginBottom: 4,
      paddingHorizontal: 10,
      textAlign: isRTL ? "right" : "left",
    },
    subtitle: {
      color: theme.colors.summary,
      marginBottom: 8,
      paddingHorizontal: 10,
      textAlign: isRTL ? "right" : "left",
    },
    rowTitle: {
      color: theme.colors.onSurface,
      textAlign: isRTL ? "right" : "left",
    },
    dotWrap: {
      justifyContent: "center",
      paddingHorizontal: 6,
    },
    dot: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    divider: {
      opacity: 0.4,
    },
  });
