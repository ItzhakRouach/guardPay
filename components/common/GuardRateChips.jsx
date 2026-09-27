import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Chip, Text, useTheme } from "react-native-paper";
import { useLanguage } from "../../hooks/lang-context";
import { currentGuardRates } from "../../lib/guardRates";
import { localeFromLang } from "../../lib/utils";

// Two one-tap presets for the hourly rate: regular guard / supervisor, from
// the security-sector extension order, with the validity note. `value` is
// the current field string; `onPick` receives the rate as a string.
export default function GuardRateChips({ value, onPick }) {
  const { t, i18n } = useTranslation();
  const { isRTL } = useLanguage();
  const theme = useTheme();
  const rates = currentGuardRates();
  const isSel = (n) => Number(String(value).replace(",", ".")) === n;
  const endDate = new Date(rates.to).toLocaleDateString(
    localeFromLang(i18n.language),
  );
  return (
    <View style={{ marginTop: 8 }}>
      <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 8 }}>
        <Chip
          compact
          selected={isSel(rates.regular)}
          onPress={() => onPick(String(rates.regular))}
        >
          {`${t("guard_rates.regular")} · ₪${rates.regular}`}
        </Chip>
        <Chip
          compact
          selected={isSel(rates.supervisor)}
          onPress={() => onPick(String(rates.supervisor))}
        >
          {`${t("guard_rates.supervisor")} · ₪${rates.supervisor}`}
        </Chip>
      </View>
      <Text
        variant="bodySmall"
        style={{
          marginTop: 6,
          color: theme.colors.onSurfaceVariant,
          textAlign: isRTL ? "right" : "left",
        }}
      >
        {rates.expired
          ? t("guard_rates.expired")
          : `${t("guard_rates.note")} ${endDate}`}
      </Text>
    </View>
  );
}
