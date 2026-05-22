import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, ScrollView, Switch, View } from "react-native";
import { Query } from "react-native-appwrite";
import { ActivityIndicator, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GhostButton, OutlinedButton } from "../../components/common/Buttons";
import Eyebrow from "../../components/common/Eyebrow";
import Hairline from "../../components/common/Hairline";
import Icon from "../../components/common/Icon";
import Pill from "../../components/common/Pill";
import Type from "../../components/common/Type";
import PreferencesChange from "../../components/profile/PreferencesChange";
import { useAuth } from "../../hooks/auth-context";
import { useLanguage } from "../../hooks/lang-context";
import { useThemeMode } from "../../hooks/theme-context";
import {
  DATABASE_ID,
  databases,
  USERS_PREFS,
  client,
} from "../../lib/appwrite";

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  right,
  last,
}) {
  const theme = useTheme();
  const Inner = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 18,
      }}
    >
      {icon ? (
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 11,
            backgroundColor: theme.colors.accentSoft,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
          }}
        >
          <Icon name={icon} size={18} color={theme.colors.accent} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Type variant="body" color={theme.colors.ink}>
          {label}
        </Type>
        {value ? (
          <Type
            variant="small"
            color={theme.colors.muted}
            style={{ marginTop: 2 }}
          >
            {value}
          </Type>
        ) : null}
      </View>
      {right || <Icon name="chev-right" size={18} color={theme.colors.muted} />}
    </View>
  );
  return (
    <View>
      {onPress ? (
        <GhostButton onPress={onPress} style={{ paddingVertical: 0 }}>
          {Inner}
        </GhostButton>
      ) : (
        Inner
      )}
      {!last ? <Hairline soft /> : null}
    </View>
  );
}

function StatsTile({ label, value }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 18,
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

export default function ProfileScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { lang, changeLanguage } = useLanguage();
  const { scheme, toggle } = useThemeMode();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [prefsOpen, setPrefsOpen] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const res = await databases.listDocuments(DATABASE_ID, USERS_PREFS, [
        Query.equal("user_id", user.$id),
      ]);
      setProfile(res.documents[0] || null);
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

  const activeMonths = profile?.$createdAt
    ? Math.max(
        1,
        Math.round(
          (Date.now() - new Date(profile.$createdAt).getTime()) /
            (1000 * 60 * 60 * 24 * 30),
        ),
      )
    : "—";

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

          <View
            style={{
              marginTop: 22,
              borderRadius: 18,
              backgroundColor: theme.colors.surface,
              borderWidth: 1,
              borderColor: theme.colors.border,
              overflow: "hidden",
              flexDirection: "row",
            }}
          >
            <StatsTile label={t("profile.activeMonths")} value={String(activeMonths)} />
            <Hairline vertical />
            <StatsTile label={t("profile.totalShifts")} value={String(profile?.lifetime_shifts || "—")} />
          </View>

          <View style={{ height: 24 }} />
          <Eyebrow color={theme.colors.muted}>
            {t("profile.settings")}
          </Eyebrow>
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
              icon="tag"
              label={t("profile.defaultRate")}
              value={`${profile?.price_per_hour ?? "—"} ₪/h`}
              onPress={() => setPrefsOpen(true)}
            />
            <SettingsRow
              icon="bell"
              label={t("profile.reminders")}
              value={
                profile?.reminder_enable ? t("common.on") : t("common.off")
              }
              onPress={() => setPrefsOpen(true)}
            />
            <SettingsRow
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

          <View style={{ height: 24 }} />
          <Eyebrow color={theme.colors.muted}>{t("profile.legal")}</Eyebrow>
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
              icon="shield"
              label={t("profile.legalLabor")}
              onPress={() => {}}
            />
            <SettingsRow
              icon="document"
              label={t("profile.legalCollective")}
              onPress={() => {}}
            />
            <SettingsRow
              icon="lock"
              label={t("profile.legalPrivacy")}
              onPress={() => {}}
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
    </View>
  );
}
