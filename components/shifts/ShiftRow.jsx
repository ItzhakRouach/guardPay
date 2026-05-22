import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useTheme } from "react-native-paper";
import Hairline from "../common/Hairline";
import Icon from "../common/Icon";
import Type from "../common/Type";
import { deriveShiftType, TYPE_ICON } from "../../lib/shiftType";

const weekday = (date, locale) =>
  date.toLocaleDateString(locale, { weekday: "short" });

const fmtTime = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

export default function ShiftRow({ shift, profile, isLast }) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "he" ? "he-IL" : "en-US";
  const start = new Date(shift.start_time);
  const type = deriveShiftType(shift, profile);
  const dayLabel = weekday(start, locale).toUpperCase();
  const dayNum = String(start.getDate());
  const totalHours =
    Number(shift.reg_hours || 0) + Number(shift.extra_hours || 0);
  const rate = Number(shift.base_rate || profile?.price_per_hour || 0);

  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          paddingVertical: 16,
          paddingHorizontal: 18,
          alignItems: "center",
        }}
      >
        <View style={{ width: 44, alignItems: "center" }}>
          <Type variant="smallLabel" color={theme.colors.muted}>
            {dayLabel}
          </Type>
          <Type variant="rowDate" color={theme.colors.ink} style={{ marginTop: 2 }}>
            {dayNum}
          </Type>
        </View>
        <Hairline vertical thickness={1} style={{ marginHorizontal: 14, height: 36 }} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Icon
              name={TYPE_ICON[type] || "clock"}
              size={16}
              color={theme.colors.accent}
            />
            <Type variant="body" color={theme.colors.ink}>
              {t(`shifts.types.${type}`)}
            </Type>
          </View>
          <Type
            variant="small"
            color={theme.colors.muted}
            style={{ marginTop: 4 }}
          >
            {`${fmtTime(shift.start_time)}–${fmtTime(shift.end_time)} · ${totalHours.toFixed(1)}h · ₪${rate}`}
          </Type>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Type variant="rowAmount" color={theme.colors.ink}>
            {Math.round(Number(shift.total_amount || 0)).toLocaleString("en-US")}
          </Type>
          <Type variant="small" color={theme.colors.muted}>
            ₪
          </Type>
        </View>
      </View>
      {!isLast ? <Hairline soft /> : null}
    </View>
  );
}
