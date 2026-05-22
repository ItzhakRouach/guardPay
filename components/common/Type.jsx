import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Text } from "react-native";
import { useTheme } from "react-native-paper";

const HEBREW_RANGE = /[֐-׿]/;

// Per-variant: family family (resolved at render based on language + content),
// size, weight, letter spacing, line height. Mirrors the type scale in the
// design spec.
const VARIANTS = {
  hero: { serif: true, size: 56, weight: "500", ls: -2, lh: 56 },
  netPay: { serif: true, size: 44, weight: "500", ls: -1.5, lh: 44 },
  welcomeTitle: {
    serif: true,
    size: 56,
    weight: "500",
    ls: -1.5,
    lh: 53,
  },
  welcomeSub: {
    serif: true,
    italic: true,
    size: 28,
    weight: "500",
    ls: -0.5,
  },
  h1: { serif: true, size: 28, weight: "500", ls: -0.6 },
  yearItalic: { serif: true, italic: true, size: 18, weight: "500", ls: -0.2 },
  sectionTitle: { serif: true, size: 22, weight: "500", ls: -0.4 },
  statValue: { serif: true, size: 22, weight: "500", ls: -0.4 },
  rowAmount: { serif: true, size: 19, weight: "500", ls: -0.3 },
  rowDate: { serif: true, size: 24, weight: "500", lh: 24 },
  sheetValue: { serif: true, size: 20, weight: "500", ls: -0.3 },
  helperItalic: { serif: true, italic: true, size: 14, weight: "500" },
  eyebrow: { serif: false, size: 11, weight: "600", ls: 2, upper: true },
  smallLabel: { serif: false, size: 10, weight: "600", ls: 1.5, upper: true },
  body: { serif: false, size: 14, weight: "500", lh: 22 },
  pitch: { serif: false, size: 15, weight: "400", lh: 23 },
  tabLabel: { serif: false, size: 11, weight: "500", ls: 0.3 },
  button: { serif: false, size: 16, weight: "600", ls: 0.2 },
  small: { serif: false, size: 12, weight: "500" },
};

// Pick the font family based on:
// - serif vs sans variant
// - italic
// - presence of Hebrew runes in the content (forces Frank Ruhl Libre)
const pickFamily = (variant, lang, text) => {
  const v = VARIANTS[variant] || VARIANTS.body;
  if (!v.serif) {
    if (v.weight === "700") return "Manrope_700Bold";
    if (v.weight === "600") return "Manrope_600SemiBold";
    if (v.weight === "500") return "Manrope_500Medium";
    return "Manrope_400Regular";
  }
  const hasHebrew = typeof text === "string" && HEBREW_RANGE.test(text);
  if (hasHebrew || lang === "he" || lang === "ar") {
    if (v.weight === "700") return "FrankRuhlLibre_700Bold";
    if (v.weight === "500") return "FrankRuhlLibre_500Medium";
    return "FrankRuhlLibre_400Regular";
  }
  if (v.italic) {
    return v.weight === "500"
      ? "CormorantGaramond_500Medium_Italic"
      : "CormorantGaramond_400Regular_Italic";
  }
  if (v.weight === "600") return "CormorantGaramond_600SemiBold";
  if (v.weight === "500") return "CormorantGaramond_500Medium";
  return "CormorantGaramond_400Regular";
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
    () => pickFamily(variant, effectiveLang, text),
    [variant, effectiveLang, text],
  );

  const isNumeric =
    numeric || /value|amount|hero|netPay|rowDate|numeric/.test(variant);
  // Hebrew content or RTL language → set writingDirection so the text
  // engine ships Hebrew runes RTL inside the string. Numeric variants
  // stay LTR so currency and totals don't get mirrored.
  const hasHebrew = HEBREW_RANGE.test(text);
  const isRtl =
    !isNumeric &&
    (hasHebrew || effectiveLang === "he" || effectiveLang === "ar");

  const computed = {
    fontFamily: family,
    fontSize: v.size,
    letterSpacing: v.ls,
    lineHeight: v.lh,
    color: color || theme.colors.ink,
    textAlign: align ?? (isRtl ? "right" : undefined),
    writingDirection: isRtl ? "rtl" : undefined,
    fontVariant: isNumeric ? ["tabular-nums"] : undefined,
    textTransform: (upper ?? v.upper) ? "uppercase" : "none",
  };

  return (
    <Text
      numberOfLines={numberOfLines}
      style={[computed, style]}
      {...rest}
    >
      {children}
    </Text>
  );
}
