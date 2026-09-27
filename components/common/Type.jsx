import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Text, useWindowDimensions } from "react-native";
import { useTheme } from "react-native-paper";
import { textStart } from "../../lib/theme";

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
  weight,
  maxFontSizeMultiplier,
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
  // React Native scales `fontSize` with the accessibility text size but
  // leaves `lineHeight` alone, so a variant with a fixed line height
  // clips its own descenders at the larger settings. Scaling it here by
  // the same factor keeps every variant legible at the largest size,
  // and respects a caller's `maxFontSizeMultiplier` cap so a fixed-height
  // box (the calendar cell) does not grow past what it can show.
  const { fontScale } = useWindowDimensions();
  const v = VARIANTS[variant] || VARIANTS.body;
  // `weight` overrides the variant's weight while keeping the family
  // language-aware. Callers must never hardcode a fontFamily in `style`:
  // that pins Arabic copy to the Hebrew face, which has no Arabic glyphs.
  const effWeight = weight || v.weight;
  const effectiveLang = lang || i18n.language;
  const text = typeof children === "string" ? children : "";
  const family = useMemo(
    () => pickFamily(effWeight, effectiveLang, text),
    [effWeight, effectiveLang, text],
  );

  const isNumeric =
    numeric || /value|amount|hero|netPay|rowDate|numeric/.test(variant);

  // Two separate questions, which the old code conflated into one flag:
  //
  // 1. Which EDGE does the paragraph sit on? That follows the screen, not
  //    the string, so a bare number on a Hebrew screen still sits on the
  //    Hebrew leading edge. `textStart` is "left", which React Native
  //    mirrors to the right edge under the root `direction` (see lib/theme).
  //    Alignment is always set explicitly: leaving it undefined falls back
  //    to natural alignment, which resolves off the first strong character
  //    and therefore strands a digits-only string on the wrong edge.
  //
  // 2. Which ORDER do the characters run in? That follows the string. A
  //    numeric run keeps `ltr` so "07:00 – 15:00" is never reordered into
  //    "15:00 – 07:00" by the bidi algorithm on a Hebrew screen.
  const rtlText =
    !isNumeric &&
    (HEBREW_RANGE.test(text) ||
      ARABIC_RANGE.test(text) ||
      effectiveLang === "he" ||
      effectiveLang === "ar");

  const cap = maxFontSizeMultiplier ?? Infinity;
  const scale = Math.max(1, Math.min(fontScale || 1, cap));

  const computed = {
    fontFamily: family,
    fontSize: v.size,
    letterSpacing: v.ls,
    lineHeight: v.lh ? Math.round(v.lh * scale) : undefined,
    color: color || theme.colors.ink,
    textAlign: align ?? textStart,
    writingDirection: rtlText ? "rtl" : "ltr",
    fontVariant: isNumeric ? ["tabular-nums"] : undefined,
    textTransform: upper ? "uppercase" : "none",
  };

  return (
    <Text
      numberOfLines={numberOfLines}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[computed, style]}
      {...rest}
    >
      {children}
    </Text>
  );
}

export { VARIANTS };
