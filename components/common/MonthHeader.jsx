import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useTheme } from "react-native-paper";
import { useLanguage } from "../../hooks/lang-context";
import { formatMonth } from "../../hooks/useMonthNav";
import Eyebrow from "./Eyebrow";
import { IconBtn } from "./Buttons";
import Type from "./Type";

// Eyebrow + serif month / italic year on the left, chevrons on the right.
// Used by Overview, Shifts and (statically) the Paycheck modal.
export default function MonthHeader({ eyebrow, currentDate, onPrev, onNext }) {
  const theme = useTheme();
  const { i18n } = useTranslation();
  const { isRTL } = useLanguage();
  const locale = i18n.language === "he" ? "he-IL" : "en-US";
  const { month, year } = formatMonth(currentDate, locale);

  // Chevron meanings flip for RTL so the visual direction matches reading
  // order. Layout itself stays LTR (force-disabled in app/_layout.jsx).
  const leftIcon = isRTL ? "chev-right" : "chev-left";
  const rightIcon = isRTL ? "chev-left" : "chev-right";
  const leftPress = isRTL ? onNext : onPrev;
  const rightPress = isRTL ? onPrev : onNext;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
      }}
    >
      <View>
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: 4 }}>
          <Type variant="h1" color={theme.colors.ink}>
            {month}
          </Type>
          <Type variant="yearItalic" color={theme.colors.inkSoft}>
            {year}
          </Type>
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 4 }}>
        <IconBtn name={leftIcon} onPress={leftPress} color={theme.colors.inkSoft} />
        <IconBtn name={rightIcon} onPress={rightPress} color={theme.colors.inkSoft} />
      </View>
    </View>
  );
}
