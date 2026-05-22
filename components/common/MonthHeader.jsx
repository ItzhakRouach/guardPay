import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useTheme } from "react-native-paper";
import { useLanguage } from "../../hooks/lang-context";
import { formatMonth } from "../../hooks/useMonthNav";
import Eyebrow from "./Eyebrow";
import { IconBtn } from "./Buttons";
import Type from "./Type";

// Header row: eyebrow + serif month / italic year on the leading edge,
// chevrons on the trailing edge. Container flex-direction flips for RTL
// so Hebrew users see the title on the right and the chevrons on the
// left, with arrows pointing in the natural Hebrew reading direction.
export default function MonthHeader({ eyebrow, currentDate, onPrev, onNext }) {
  const theme = useTheme();
  const { i18n } = useTranslation();
  const { isRTL } = useLanguage();
  const locale = i18n.language === "he" ? "he-IL" : "en-US";
  const { month, year } = formatMonth(currentDate, locale);

  // In LTR: prev = ‹, next = › on the right.
  // In RTL: visually-left chevron means "next month" (reading direction),
  // visually-right chevron means "previous month".
  const prevIcon = isRTL ? "chev-right" : "chev-left";
  const nextIcon = isRTL ? "chev-left" : "chev-right";

  return (
    <View
      style={{
        flexDirection: isRTL ? "row-reverse" : "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
      }}
    >
      <View style={{ alignItems: isRTL ? "flex-end" : "flex-start" }}>
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <View
          style={{
            flexDirection: isRTL ? "row-reverse" : "row",
            alignItems: "baseline",
            gap: 8,
            marginTop: 4,
          }}
        >
          <Type variant="h1" color={theme.colors.ink}>
            {month}
          </Type>
          <Type variant="yearItalic" color={theme.colors.inkSoft}>
            {year}
          </Type>
        </View>
      </View>
      <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 4 }}>
        <IconBtn name={prevIcon} onPress={onPrev} color={theme.colors.inkSoft} />
        <IconBtn name={nextIcon} onPress={onNext} color={theme.colors.inkSoft} />
      </View>
    </View>
  );
}
