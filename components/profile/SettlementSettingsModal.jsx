import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, ScrollView, StyleSheet, TextInput, View } from "react-native";
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
import { DATABASE_ID, USERS_PREFS, databases } from "../../lib/appwrite";
import settlementsData from "../../utils/settlements.json";

// Picker launched from the Profile → Preferences "settlement" row. Lets
// the user search the 391 tax-credited settlements and pick one; the
// chosen { name, percent, annualCap } is stored on users_prefs and feeds
// the income-tax credit in calculateSalary (via useMonthlySalary, which
// reads the same useAuth profile we refresh here). A clear action removes
// the benefit for users who move.
export default function SettlementSettingsModal({ visible, onDismiss }) {
  const theme = useTheme();
  const { isRTL } = useLanguage();
  const { user, profile, fetchUserProfile } = useAuth();
  const { t } = useTranslation();
  const styles = makeStyle(theme, isRTL);

  const [searchQuery, setSearchQuery] = useState("");

  // Match the proven filter from the legacy picker: only search once the
  // query is meaningful, cap the list so the modal stays light.
  const filtered = useMemo(() => {
    if (searchQuery.trim().length < 2) return [];
    return settlementsData
      .filter((s) => s.name.includes(searchQuery.trim()))
      .slice(0, 10);
  }, [searchQuery]);

  // Returns true only if the write landed, so callers don't dismiss on a
  // silent failure (offline / permissions) and leave the user thinking the
  // settlement was saved when neto won't actually change.
  const persist = async (fields) => {
    if (!profile?.$id) return false;
    try {
      await databases.updateDocument(DATABASE_ID, USERS_PREFS, profile.$id, fields);
      await fetchUserProfile(user);
      return true;
    } catch (err) {
      console.log("Failed to update settlement:", err);
      Alert.alert(t("edit_pref.msg_err"));
      return false;
    }
  };

  const onSelect = async (item) => {
    const ok = await persist({
      settlement_name: item.name,
      settlement_percent: item.percent,
      settlement_annual_cap: item.annualCap,
    });
    if (ok) handleDismiss();
  };

  const onClear = async () => {
    const ok = await persist({
      settlement_name: "",
      settlement_percent: 0,
      settlement_annual_cap: 0,
    });
    if (ok) handleDismiss();
  };

  const handleDismiss = () => {
    setSearchQuery("");
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.clipWrap}>
          <View style={styles.header}>
            <Text variant="titleLarge" style={styles.title}>
              {t("settlement.modal_title")}
            </Text>
            <IconButton
              icon="close"
              size={22}
              onPress={handleDismiss}
              accessibilityLabel={t("common.cancel")}
            />
          </View>

          {profile?.settlement_name ? (
            <Text variant="bodyMedium" style={styles.current}>
              {`${profile.settlement_name} · ${profile.settlement_percent}%`}
            </Text>
          ) : null}

          <View style={styles.searchBox}>
            <TextInput
              placeholder={t("settlement.search_placeholder")}
              placeholderTextColor={theme.colors.secondary}
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchInput}
              autoCorrect={false}
            />
          </View>

          <ScrollView style={styles.results} keyboardShouldPersistTaps="handled">
            {filtered.map((item) => (
              <List.Item
                key={item.name}
                title={item.name}
                titleStyle={styles.itemTitle}
                description={t("settlement.benefit_desc", {
                  percent: item.percent,
                  cap: item.annualCap.toLocaleString(),
                })}
                descriptionStyle={styles.itemDesc}
                onPress={() => onSelect(item)}
                left={(p) => <List.Icon {...p} icon="map-marker-outline" />}
              />
            ))}
          </ScrollView>

          {profile?.settlement_name ? (
            <>
              <Divider style={styles.dividerStyle} bold={false} />
              <TouchableRipple onPress={onClear}>
                <View style={styles.row}>
                  <IconButton
                    icon="close-circle-outline"
                    size={22}
                    iconColor={theme.colors.error}
                    style={styles.rowIcon}
                  />
                  <Text
                    variant="bodyLarge"
                    style={[styles.rowLabel, { color: theme.colors.error }]}
                    numberOfLines={1}
                  >
                    {t("settlement.clear")}
                  </Text>
                </View>
              </TouchableRipple>
            </>
          ) : null}
        </View>
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
    current: {
      paddingHorizontal: 18,
      paddingBottom: 8,
      color: theme.colors.summary,
      textAlign: isRTL ? "right" : "left",
      writingDirection: isRTL ? "rtl" : "ltr",
    },
    searchBox: {
      marginHorizontal: 14,
      marginBottom: 8,
      borderRadius: 12,
      height: 48,
      justifyContent: "center",
      paddingHorizontal: 14,
      backgroundColor: theme.colors.elevation.level2,
    },
    searchInput: {
      fontSize: 16,
      color: theme.colors.onSurface,
      paddingVertical: 0,
      textAlign: isRTL ? "right" : "left",
      writingDirection: isRTL ? "rtl" : "ltr",
    },
    results: {
      maxHeight: 300,
    },
    itemTitle: {
      textAlign: isRTL ? "right" : "left",
      writingDirection: isRTL ? "rtl" : "ltr",
      color: theme.colors.onSurface,
    },
    itemDesc: {
      textAlign: isRTL ? "right" : "left",
      writingDirection: isRTL ? "rtl" : "ltr",
      color: theme.colors.secondary,
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
      fontSize: 18,
      textAlign: isRTL ? "right" : "left",
      writingDirection: isRTL ? "rtl" : "ltr",
      paddingHorizontal: 4,
    },
  });
