import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useTheme } from "react-native-paper";
import { computeComplianceFlags } from "../../lib/compliance";
import { localeFromLang } from "../../lib/utils";
import Eyebrow from "../common/Eyebrow";
import Hairline from "../common/Hairline";
import Icon from "../common/Icon";
import Type from "../common/Type";
import { radius, textStart } from "../../lib/theme";

// "כדאי לדעת": legal limits crossed this month, in plain language. Rendered
// only when there is something to say. Never affects pay. Laid out like the
// Insights card above it: one row per finding, readable text size.
const sundayOf = (weekKey) => {
  const [y, m, d] = weekKey.split("-").map(Number);
  return new Date(y, m, d);
};

export default function ComplianceCard({ shifts }) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const flags = useMemo(() => computeComplianceFlags(shifts), [shifts]);
  const locale = localeFromLang(i18n.language);
  const fmt = (date) =>
    date.toLocaleDateString(locale, { day: "numeric", month: "short" });

  const rows = [];
  for (const iso of flags.longDays) {
    rows.push({
      icon: "clock",
      text: t("compliance.long_day", { date: fmt(new Date(iso)) }),
    });
  }
  for (const w of flags.otWeeks) {
    rows.push({
      icon: "chart",
      text: t("compliance.weekly_ot", {
        week: fmt(sundayOf(w.weekKey)),
        hours: w.hours,
      }),
    });
  }
  for (const k of flags.shortRestWeeks) {
    rows.push({
      icon: "moon",
      text: t("compliance.short_rest", { week: fmt(sundayOf(k)) }),
    });
  }
  if (rows.length === 0) return null;

  const align = textStart;
  return (
    <View
      style={{
        marginTop: 16,
        borderRadius: radius.card,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 16,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Icon name="shield" size={18} color={theme.colors.accent} />
        <Type variant="sectionTitle" color={theme.colors.ink}>
          {t("compliance.title")}
        </Type>
      </View>

      <View style={{ marginTop: 6 }}>
        {rows.map((r, i) => (
          <View key={`${i}-${r.text}`}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 12,
                paddingVertical: 14,
              }}
            >
              <View style={{ paddingTop: 3 }}>
                <Icon name={r.icon} size={18} color={theme.colors.inkSoft} />
              </View>
              <Type
                variant="pitch"
                color={theme.colors.ink}
                style={{ flex: 1, textAlign: align }}
              >
                {r.text}
              </Type>
            </View>
            {i < rows.length - 1 ? <Hairline soft /> : null}
          </View>
        ))}
      </View>

      <Hairline soft />
      <View style={{ paddingTop: 12 }}>
        <Eyebrow color={theme.colors.muted}>
          {t("compliance.footer_label")}
        </Eyebrow>
        <Type
          variant="body"
          color={theme.colors.muted}
          style={{ marginTop: 6, textAlign: align }}
        >
          {t("compliance.footer")}
        </Type>
      </View>
    </View>
  );
}
