import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet, View } from "react-native";
import {
  Button,
  Divider,
  IconButton,
  Modal,
  Portal,
  SegmentedButtons,
  Switch,
  Text,
  useTheme,
} from "react-native-paper";
import { useAuth } from "../../hooks/auth-context";
import { useLanguage } from "../../hooks/lang-context";
import { DATABASE_ID, USERS_PREFS, databases } from "../../lib/appwrite";
import {
  DEFAULT_RULES,
  parseOvertimeRules,
  serialiseOvertimeRules,
} from "../../lib/overtimeRules";
import { recomputeRange } from "../../lib/weeklyOt";
import { useShiftsStore } from "../../hooks/shifts-store";
import LoadingSpinner from "../common/LoadingSpinnner";

// Three controls, all explained in one line each. Saving recomputes the
// CURRENT month's weeks under the new rules (owner decision); earlier
// months are never touched.
export default function OvertimeSettingsModal({ visible, onDismiss }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { user, profile, fetchUserProfile } = useAuth();
  const { fetchMonth } = useShiftsStore();
  const styles = makeStyle(theme, isRTL);
  const [rules, setRules] = useState({ ...DEFAULT_RULES });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) setRules(parseOvertimeRules(profile?.overtime_rules));
  }, [visible, profile?.overtime_rules]);

  const onSave = async () => {
    if (!profile?.$id || !user?.$id) return;
    const next = serialiseOvertimeRules(rules);
    // Nothing changed -> nothing to write and, above all, nothing to
    // recompute (a recompute would also normalise old documents).
    if (next === serialiseOvertimeRules(profile.overtime_rules)) {
      onDismiss();
      return;
    }
    setSaving(true);
    try {
      await databases.updateDocument(DATABASE_ID, USERS_PREFS, profile.$id, {
        overtime_rules: next,
      });
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const { applied, failed } = await recomputeRange(
        user.$id,
        from,
        to,
        rules,
      );
      await fetchUserProfile(user);
      // Don't rely on realtime alone to refresh what's on screen.
      const y = now.getFullYear();
      const m = now.getMonth();
      const prev = new Date(y, m - 1, 1);
      const nxt = new Date(y, m + 1, 1);
      await Promise.allSettled(
        [
          `${y}-${m}`,
          `${prev.getFullYear()}-${prev.getMonth()}`,
          `${nxt.getFullYear()}-${nxt.getMonth()}`,
        ].map((k) => fetchMonth(k, { force: true })),
      );
      onDismiss();
      if (failed) Alert.alert(t("overtime.recompute_partial", { failed }));
      else if (applied) Alert.alert(t("overtime.recomputed", { n: applied }));
    } catch (err) {
      console.log("Failed to save overtime rules:", err);
      Alert.alert(t("edit_pref.msg_err"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={saving ? undefined : onDismiss}
        contentContainerStyle={styles.modal}
      >
        <View style={styles.inner}>
          <View style={styles.header}>
            <Text style={styles.title}>{t("overtime.title")}</Text>
            <IconButton
              icon="close"
              size={20}
              onPress={onDismiss}
              disabled={saving}
            />
          </View>
          <Divider style={styles.divider} />

          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text variant="titleSmall" style={styles.label}>
                {t("overtime.weekly_label")}
              </Text>
              <Text variant="bodySmall" style={styles.hint}>
                {t("overtime.weekly_hint")}
              </Text>
            </View>
            <Switch
              value={rules.weekly}
              onValueChange={(v) => setRules((r) => ({ ...r, weekly: v }))}
            />
          </View>

          <Text variant="titleSmall" style={[styles.label, { marginTop: 18 }]}>
            {t("overtime.daily_label")}
          </Text>
          <SegmentedButtons
            value={String(rules.daily)}
            onValueChange={(v) => setRules((r) => ({ ...r, daily: Number(v) }))}
            buttons={[
              { value: "8", label: "8" },
              { value: "8.6", label: "8.6" },
            ]}
          />
          <Text variant="bodySmall" style={styles.hint}>
            {t("overtime.daily_hint")}
          </Text>

          <Text variant="titleSmall" style={[styles.label, { marginTop: 18 }]}>
            {t("overtime.midnight_label")}
          </Text>
          <SegmentedButtons
            value={rules.midnightSplit ? "split" : "continuous"}
            onValueChange={(v) =>
              setRules((r) => ({ ...r, midnightSplit: v === "split" }))
            }
            buttons={[
              { value: "continuous", label: t("overtime.midnight_continuous") },
              { value: "split", label: t("overtime.midnight_split") },
            ]}
          />
          <Text variant="bodySmall" style={styles.hint}>
            {t("overtime.midnight_hint")}
          </Text>

          <Text variant="bodySmall" style={[styles.hint, { marginTop: 16 }]}>
            {t("overtime.save_note")}
          </Text>

          <Button
            mode="contained"
            onPress={onSave}
            disabled={saving}
            style={styles.save}
          >
            {t("edit_pref.btn")}
          </Button>
        </View>
        {saving && <LoadingSpinner overlay />}
      </Modal>
    </Portal>
  );
}

const makeStyle = (theme, isRTL) =>
  StyleSheet.create({
    modal: {
      backgroundColor: theme.colors.surface,
      margin: 20,
      borderRadius: 28,
      overflow: "hidden",
    },
    inner: { padding: 24 },
    header: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    title: { fontSize: 22, fontWeight: "bold", color: theme.colors.onSurface },
    divider: { marginVertical: 12, opacity: 0.5 },
    rowBetween: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      gap: 12,
    },
    label: {
      color: theme.colors.onSurface,
      textAlign: isRTL ? "right" : "left",
      marginBottom: 6,
    },
    hint: {
      color: theme.colors.onSurfaceVariant,
      textAlign: isRTL ? "right" : "left",
      marginTop: 6,
    },
    save: { marginTop: 20, borderRadius: 14 },
  });
