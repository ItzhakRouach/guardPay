import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "../../hooks/lang-context";
import { useOtaUpdates } from "../../hooks/useOtaUpdates";
import Icon from "../common/Icon";
import Type from "../common/Type";

// Small bottom notice shown once an OTA update has been downloaded:
// "Update ready — Restart / Later". Sits above the tab bar.
const TAB_BAR_CLEARANCE = 92;

export default function UpdateBanner() {
  const { ready, restart, dismiss } = useOtaUpdates();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  if (!ready) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: insets.bottom + TAB_BAR_CLEARANCE,
      }}
    >
      <View
        accessibilityRole="alert"
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderRadius: 14,
          backgroundColor: theme.colors.anchor,
          shadowColor: theme.colors.ink,
          shadowOpacity: 0.18,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }}
      >
        <Icon name="sparkle" size={18} color={theme.colors.anchorInk} />
        <Type
          variant="body"
          color={theme.colors.anchorInk}
          style={{ flex: 1, textAlign: isRTL ? "right" : "left" }}
        >
          {t("service.update_ready")}
        </Type>
        <Pressable onPress={dismiss} hitSlop={8} accessibilityRole="button">
          <Type variant="small" color={theme.colors.anchorMuted}>
            {t("service.update_later")}
          </Type>
        </Pressable>
        <Pressable
          onPress={restart}
          hitSlop={8}
          accessibilityRole="button"
          style={{
            backgroundColor: theme.colors.anchorInk,
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 10,
          }}
        >
          <Type variant="small" color={theme.colors.anchor}>
            {t("service.update_restart")}
          </Type>
        </Pressable>
      </View>
    </View>
  );
}
