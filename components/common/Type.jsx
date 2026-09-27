import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Text } from "react-native";
import { useTheme } from "react-native-paper";

const HEBREW_RANGE = /[֐-׿]/;
const ARABIC_RANGE = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;

// One type scale, one family. Sizes and weights are the ones drawn in the
// redesign mockups; money is the largest thing on any screen and labels
// recede beneath it rather than shouting in tracked-out capitals.
//
// No variant is uppercase and none is italic any more: both were the
// template chrome the redesign set out to remove. `upper` is still honoured
// when a caller passes it explicitly.
const VARIANTS = {
  // Money and figures
  hero: { size: 46, weight: "600", ls: -1.8, lh: 46 },
  netPay: { size: 38, weight: "600", ls: -1.2, lh: 38 },
  statValue: { size: 21, weight: "600", ls: -0.3, lh: 25 },
  rowAmount: { size: 16, weight: "600", ls: -0.2, lh: 20 },
  rowDate: { size: 19, weight: "500", lh: 22 },
  sheetValue: { size: 15, weight: "500", lh: 20 },

  // Headings
  welcomeTitle: { size: 40, weight: "600", ls: -1.2, lh: 44 },
  h1: { size: 26, weight: "600", ls: -0.4, lh: 31 },
  sectionTitle: { size: 17, weight: "600", ls: -0.2, lh: 22 },

  // Body and labels
  welcomeSub: { size: 19, weight: "400", lh: 28 },
  body: { size: 15, weight: "400", lh: 22 },
  pitch: { size: 15, weight: "400", lh: 23 },
  yearItalic: { size: 17, weight: "400", lh: 22 },
  eyebrow: { size: 13, weight: "400", lh: 17 },
  helperItalic: { size: 13, weight: "400", lh: 19 },
  smallLabel: { size: 12, weight: "500", lh: 16 },
  small: { size: 12, weight: "400", lh: 16 },
  button: { size: 15, weight: "600", ls: 0.1, lh: 20 },
  tabLabel: { size: 11, weight: "500", ls: 0.2, lh: 14 },
};

// IBM Plex Sans Hebrew carries Hebrew, Latin and the figures, so one face
// covers he and en. Arabic gets its designed sibling — the two are metric
// companions, so a mixed screen keeps one voice.
const HEBREW_FACES = {
  400: "IBMPlexSansHebrew_400Regular",
  500: "IBMPlexSansHebrew_500Medium",
  600: "IBMPlexSansHebrew_600SemiBold",
  700: "IBMPlexSansHebrew_700Bold",
};
const ARABIC_FACES = {
  400: "IBMPlexSansArabic_400Regular",
  500: "IBMPlexSansArabic_500Medium",
  600: "IBMPlexSansArabic_600SemiBold",
  700: "IBMPlexSansArabic_700Bold",
};

// Arabic runes in the string, or Arabic is the active language and the
// string carries no Hebrew: use the Arabic face. Everything else, including
// bare numbers, uses the Hebrew face, which has full Latin coverage.
const pickFamily = (weight, lang, text) => {
  const w = HEBREW_FACES[weight] ? weight : "400";
  const hasArabic = ARABIC_RANGE.test(text);
  const hasHebrew = HEBREW_RANGE.test(text);
  const arabic = hasArabic || (lang === "ar" && !hasHebrew);
  return (arabic ? ARABIC_FACES : HEBREW_FACES)[w];
};

export default function Type({
  variant = "body",
  color,
  align,
  numeric = false,
  upper,
  style,
  children,
  numberOfLines,
  lang,
  ...rest
}) {
  const theme = useTheme();
  const { i18n } = useTranslation();
  const v = VARIANTS[variant] || VARIANTS.body;
  const effectiveLang = lang || i18n.language;
  const text = typeof children === "string" ? children : "";
  const family = useMemo(
    () => pickFamily(v.weight, effectiveLang, text),
    [v.weight, effectiveLang, text],
  );

  const isNumeric =
    numeric || /value|amount|hero|netPay|rowDate|numeric/.test(variant);
  // Hebrew or Arabic content stays RTL inside the string. Numeric variants
  // stay LTR so a currency total is never mirrored.
  const isRtl =
    !isNumeric &&
    (HEBREW_RANGE.test(text) ||
      ARABIC_RANGE.test(text) ||
      effectiveLang === "he" ||
      effectiveLang === "ar");

  const computed = {
    fontFamily: family,
    fontSize: v.size,
    letterSpacing: v.ls,
    lineHeight: v.lh,
    color: color || theme.colors.ink,
    textAlign: align ?? (isRtl ? "right" : undefined),
    writingDirection: isRtl ? "rtl" : undefined,
    fontVariant: isNumeric ? ["tabular-nums"] : undefined,
    textTransform: upper ? "uppercase" : "none",
  };

  return (
    <Text numberOfLines={numberOfLines} style={[computed, style]} {...rest}>
      {children}
    </Text>
  );
}

export { VARIANTS };
