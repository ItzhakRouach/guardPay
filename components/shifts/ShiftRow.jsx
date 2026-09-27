import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useTheme } from "react-native-paper";
import { useThemeMode } from "../../hooks/theme-context";
import { docBruto } from "../../lib/monthlyTotals";
import { resolveDot, resolveTint } from "../../lib/shiftColors";
import { deriveShiftType } from "../../lib/shiftType";
import { localeFromLang } from "../../lib/utils";
import { spacing } from "../../lib/theme";
import Hairline from "../common/Hairline";
import Type from "../common/Type";

const weekday = (date, locale) =>
  date.toLocaleDateString(locale, { weekday: "short" });

const fmtTime = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

// One shift. Source order is [date | type + time | amount]; the app-wide
// layout direction puts the date on the leading edge and the amount on the
// trailing one in both directions.
//
// The old meta line read "07:00–15:00 · 8.0h · ₪54" — three unrelated facts
// welded together with middle dots, which is template chrome and reads
// badly in Hebrew. Time stays under the type; the rate sits with the amount
// it produced; the hours are on the row's own summary line above the list.
export default function ShiftRow({ shift, profile, isLast }) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const { scheme } = useThemeMode();
  const locale = localeFromLang(i18n.language);
  const start = new Date(shift.start_time);
  const type = deriveShiftType(shift, profile);
  const dayLabel = weekday(start, locale);
  const dayNum = String(start.getDate());
  const totalHours =
    Number(shift.reg_hours || 0) + Number(shift.extra_hours || 0);
  const rate = Number(shift.base_rate || profile?.price_per_hour || 0);

  const tint = resolveTint(shift, profile?.shift_colors, scheme);

  return (
    <View style={{ backgroundColor: tint || "transparent" }}>
      <View
        style={{
          flexDirection: "row",
          paddingVertical: spacing.rowV,
          paddingHorizontal: spacing.cardH,
          alignItems: "center",
        }}
      >
        <View style={{ width: 44, alignItems: "center" }}>
          <Type variant="smallLabel" color={theme.colors.muted}>
            {dayLabel}
          </Type>
          <Type
            variant="rowDate"
            color={theme.colors.ink}
            style={{ marginTop: 2 }}
          >
            {dayNum}
          </Type>
        </View>
        <View
          style={{
            width: 1,
            height: 36,
            backgroundColor: theme.colors.borderSoft,
            marginHorizontal: 14,
          }}
        />
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: resolveDot(type, scheme),
              }}
            />
            <Type variant="body" color={theme.colors.ink}>
              {t(`shifts.types.${type}`)}
            </Type>
          </View>
          <Type
            variant="small"
            numeric
            color={theme.colors.muted}
            style={{ marginTop: 3 }}
          >
            {`${fmtTime(shift.start_time)} – ${fmtTime(shift.end_time)}`}
          </Type>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <View
            style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}
          >
            <Type variant="rowAmount" color={theme.colors.ink}>
              {Math.round(docBruto(shift)).toLocaleString("en-US")}
            </Type>
            <Type variant="small" color={theme.colors.muted}>
              ₪
            </Type>
          </View>
          <Type
            variant="small"
            numeric
            color={theme.colors.muted}
            style={{ marginTop: 3 }}
          >
            {`${totalHours.toFixed(1)}h · ₪${rate}`}
          </Type>
        </View>
      </View>
      {!isLast ? <Hairline soft /> : null}
    </View>
  );
}
