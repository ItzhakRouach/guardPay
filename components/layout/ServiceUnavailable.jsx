import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GhostButton, PrimaryButton } from "../common/Buttons";
import Icon from "../common/Icon";
import Type from "../common/Type";

// Full-screen state shown by the RouteGuard when the Appwrite backend is
// unreachable (paused project, no network, 5xx). Replaces the old
// behaviour of routing a signed-in user to onboarding, which read as
// "your account is gone".
//
// `kind` comes from classifyAppwriteError. Only "network" gets its own
// copy — paused/server are both "not your fault, try later" to the user.
// `onSignOut` is optional: offered as an escape hatch when a user is
// signed in but their profile can't be loaded.
export default function ServiceUnavailable({ kind, onRetry, onSignOut }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const isNetwork = kind === "network";

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.bg,
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 28,
        justifyContent: "center",
      }}
    >
      <View style={{ alignItems: "center" }}>
        <Icon name="shield" size={44} color={theme.colors.muted} stroke={1.4} />
        <Type
          variant="sectionTitle"
          color={theme.colors.ink}
          align="center"
          style={{ marginTop: 18 }}
        >
          {isNetwork
            ? t("service.network_title")
            : t("service.unavailable_title")}
        </Type>
        <Type
          variant="body"
          color={theme.colors.muted}
          align="center"
          style={{ marginTop: 8, maxWidth: 300 }}
        >
          {isNetwork
            ? t("service.network_body")
            : t("service.unavailable_body")}
        </Type>
      </View>

      <View style={{ marginTop: 32, gap: 12 }}>
        <PrimaryButton label={t("service.retry")} onPress={onRetry} />
        {onSignOut ? (
          <GhostButton
            label={t("service.sign_out")}
            onPress={onSignOut}
            style={{ alignSelf: "center" }}
          />
        ) : null}
      </View>
    </View>
  );
}
