import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useTheme } from "react-native-paper";
import { useLanguage } from "../../hooks/lang-context";
import { formatMonth } from "../../hooks/useMonthNav";
import { localeFromLang } from "../../lib/utils";
import Eyebrow from "./Eyebrow";
import { IconBtn } from "./Buttons";
import Type from "./Type";

// Header row: eyebrow, month and year on the leading edge, chevrons on the
// trailing edge. Nothing here flips by hand — the root layout direction
// mirrors the row, so Hebrew and Arabic get the title on the right and the
// chevrons on the left. Only the chevron GLYPHS are chosen from `isRTL`,
// because an arrow's shape is not something Yoga can mirror.
export default function MonthHeader({ eyebrow, currentDate, onPrev, onNext }) {
  const theme = useTheme();
  const { i18n } = useTranslation();
  const { isRTL } = useLanguage();
  const locale = localeFromLang(i18n.language);
  const { month, year } = formatMonth(currentDate, locale);

  // In LTR: prev = ‹, next = › on the right.
  // In RTL: visually-left chevron means "next month" (reading direction),
  // visually-right chevron means "previous month".
  const prevIcon = isRTL ? "chev-right" : "chev-left";
  const nextIcon = isRTL ? "chev-left" : "chev-right";

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
      }}
    >
      {/* flex-start is the LEADING edge: Yoga resolves the cross axis
          against the root direction, so this is already the right edge
          in Hebrew and Arabic. An isRTL ternary here flips it twice. */}
      <View style={{ alignItems: "flex-start" }}>
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <View
          style={{
            flexDirection: "row",
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
      <View style={{ flexDirection: "row", gap: 4 }}>
        <IconBtn
          name={prevIcon}
          onPress={onPrev}
          color={theme.colors.inkSoft}
        />
        <IconBtn
          name={nextIcon}
          onPress={onNext}
          color={theme.colors.inkSoft}
        />
      </View>
    </View>
  );
}
