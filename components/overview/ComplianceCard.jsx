import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useTheme } from "react-native-paper";
import { useLanguage } from "../../hooks/lang-context";
import { computeComplianceFlags } from "../../lib/compliance";
import { localeFromLang } from "../../lib/utils";
import Eyebrow from "../common/Eyebrow";
import Icon from "../common/Icon";
import Type from "../common/Type";

// "כדאי לדעת": legal limits crossed this month, in plain language. Rendered
// only when there is something to say. Never affects pay.
const sundayOf = (weekKey) => {
  const [y, m, d] = weekKey.split("-").map(Number);
  return new Date(y, m, d);
};

export default function ComplianceCard({ shifts }) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const { isRTL } = useLanguage();
  const flags = useMemo(() => computeComplianceFlags(shifts), [shifts]);
  const locale = localeFromLang(i18n.language);
  const fmt = (date) =>
    date.toLocaleDateString(locale, { day: "numeric", month: "short" });

  const lines = [];
  for (const iso of flags.longDays) {
    lines.push(t("compliance.long_day", { date: fmt(new Date(iso)) }));
  }
  for (const w of flags.otWeeks) {
    lines.push(
      t("compliance.weekly_ot", {
        week: fmt(sundayOf(w.weekKey)),
        hours: w.hours,
      }),
    );
  }
  for (const k of flags.shortRestWeeks) {
    lines.push(t("compliance.short_rest", { week: fmt(sundayOf(k)) }));
  }
  if (lines.length === 0) return null;

  return (
    <View
      style={{
        marginTop: 22,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        padding: 18,
      }}
    >
      <View
        style={{
          flexDirection: isRTL ? "row-reverse" : "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Icon name="shield" size={16} color={theme.colors.accent} />
        <Eyebrow color={theme.colors.muted}>{t("compliance.title")}</Eyebrow>
      </View>
      <View style={{ marginTop: 10, gap: 8 }}>
        {lines.map((line) => (
          <Type
            key={line}
            variant="body"
            color={theme.colors.ink}
            style={{ textAlign: isRTL ? "right" : "left" }}
          >
            {`• ${line}`}
          </Type>
        ))}
      </View>
      <Type
        variant="small"
        color={theme.colors.muted}
        style={{ marginTop: 12, textAlign: isRTL ? "right" : "left" }}
      >
        {t("compliance.footer")}
      </Type>
    </View>
  );
}
