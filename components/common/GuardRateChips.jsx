import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Chip, Text, useTheme } from "react-native-paper";
import { currentGuardRates } from "../../lib/guardRates";
import { localeFromLang } from "../../lib/utils";
import { radius, textStart } from "../../lib/theme";

// Paper multiplies theme.roundness by 2 for Chip, which would give 22.
// Chips are controls, so they take the control radius.
const chipShape = { borderRadius: radius.control };

// Two one-tap presets for the hourly rate: regular guard / supervisor, from
// the security-sector extension order, with the validity note. `value` is
// the current field string; `onPick` receives the rate as a string.
export default function GuardRateChips({ value, onPick }) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const rates = currentGuardRates();
  const isSel = (n) => Number(String(value).replace(",", ".")) === n;
  const endDate = new Date(rates.to).toLocaleDateString(
    localeFromLang(i18n.language),
  );
  return (
    <View style={{ marginTop: 8 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Chip
          compact
          style={chipShape}
          selected={isSel(rates.regular)}
          onPress={() => onPick(String(rates.regular))}
        >
          {`${t("guard_rates.regular")} · ₪${rates.regular}`}
        </Chip>
        <Chip
          compact
          style={chipShape}
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
          textAlign: textStart,
        }}
      >
        {rates.expired
          ? t("guard_rates.expired")
          : `${t("guard_rates.note")} ${endDate}`}
      </Text>
    </View>
  );
}
