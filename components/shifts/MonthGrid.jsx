import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import { useTheme } from "react-native-paper";
import { useThemeMode } from "../../hooks/theme-context";
import { bucketByDay, monthShape } from "../../lib/monthGrid";
import { resolveDot } from "../../lib/shiftColors";
import { deriveShiftType } from "../../lib/shiftType";
import { localeFromLang } from "../../lib/utils";
import { radius, spacing } from "../../lib/theme";
import Type from "../common/Type";

const CELL_HEIGHT = 52;
const MAX_DOTS = 3;

// Sunday-first weekday initials in the active language. `narrow` gives
// א ב ג … in Hebrew and ح ن ث … in Arabic, so nothing is hardcoded.
function useWeekdayInitials(locale) {
  return useMemo(() => {
    const out = [];
    for (let i = 0; i < 7; i += 1) {
      // 2026-02-01 was a Sunday, so this walks Sunday → Saturday.
      const d = new Date(2026, 1, 1 + i);
      out.push(d.toLocaleDateString(locale, { weekday: "narrow" }));
    }
    return out;
  }, [locale]);
}

/**
 * One month as a seven-column grid. Each day carries a dot per shift,
 * coloured by type, and the whole cell is the touch target.
 *
 * Layout direction comes from the container, so the grid mirrors itself in
 * Hebrew and Arabic: Sunday lands on the right with no per-cell flipping.
 */
export default function MonthGrid({
  currentDate,
  shifts,
  profile,
  selectedDay,
  onSelectDay,
}) {
  const theme = useTheme();
  const { scheme } = useThemeMode();
  const { i18n, t } = useTranslation();
  const locale = localeFromLang(i18n.language);
  const initials = useWeekdayInitials(locale);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const shape = useMemo(() => monthShape(year, month), [year, month]);
  const byDay = useMemo(() => bucketByDay(shifts), [shifts]);

  const now = new Date();
  const todayDay =
    now.getFullYear() === year && now.getMonth() === month
      ? now.getDate()
      : null;

  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: radius.card,
        paddingHorizontal: 10,
        paddingTop: 12,
        paddingBottom: 8,
      }}
    >
      <View style={{ flexDirection: "row" }}>
        {initials.map((w, i) => (
          <Type
            key={i}
            variant="small"
            color={theme.colors.muted}
            align="center"
            style={{ flex: 1, paddingBottom: 6 }}
          >
            {w}
          </Type>
        ))}
      </View>

      {Array.from({ length: shape.weeksInMonth }, (_, row) => (
        <View key={row} style={{ flexDirection: "row" }}>
          {shape.cells.slice(row * 7, row * 7 + 7).map((day, col) => {
            if (day === null) {
              return (
                <View key={col} style={{ flex: 1, height: CELL_HEIGHT }} />
              );
            }
            const docs = byDay[day] || [];
            const isToday = day === todayDay;
            const isSelected = day === selectedDay;
            const dots = docs.slice(0, MAX_DOTS);
            return (
              <Pressable
                key={col}
                onPress={() => onSelectDay(day)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={t("shifts.day_a11y", {
                  day,
                  count: docs.length,
                })}
                style={{
                  flex: 1,
                  height: CELL_HEIGHT,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                  borderRadius: radius.control,
                  backgroundColor: isToday
                    ? theme.colors.accentFill
                    : isSelected
                      ? theme.colors.surfaceAlt
                      : "transparent",
                }}
              >
                <Type
                  variant="sheetValue"
                  numeric
                  color={
                    isToday
                      ? theme.colors.onAccentFill
                      : docs.length
                        ? theme.colors.ink
                        : theme.colors.muted
                  }
                >
                  {String(day)}
                </Type>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 3,
                    height: 5,
                    alignItems: "center",
                  }}
                >
                  {dots.map((s) => (
                    <View
                      key={s.$id}
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: 3,
                        backgroundColor: isToday
                          ? theme.colors.onAccentFill
                          : resolveDot(deriveShiftType(s, profile), scheme),
                      }}
                    />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export { CELL_HEIGHT, spacing };
