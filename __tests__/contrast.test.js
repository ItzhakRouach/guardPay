/* global describe, test, expect */
// WCAG AA, enforced rather than asserted in a design doc. Guards read this
// screen outdoors in daylight and in a dim booth at 3am, so a token pair
// that fails here is a real legibility problem, not a technicality.
//
// Thresholds: 4.5:1 for body text, 3:1 for large text (>=24px or >=19px
// bold) and for non-text marks such as the today dot.
const { lightTokens, darkTokens } = require("../lib/theme");

const toRgb = (c) => {
  const m = String(c).match(/^#([0-9a-f]{6})$/i);
  if (m) {
    const h = m[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  }
  const rgba = String(c).match(/rgba?\(([^)]+)\)/);
  if (rgba)
    return rgba[1]
      .split(",")
      .slice(0, 3)
      .map((x) => Number(x.trim()));
  throw new Error(`not a colour: ${c}`);
};

// Flatten a translucent foreground over its background before measuring.
const over = (fg, bg) => {
  const a = String(fg).match(/rgba\([^)]*,\s*([\d.]+)\)/);
  if (!a) return toRgb(fg);
  const alpha = Number(a[1]);
  const f = toRgb(fg);
  const b = toRgb(bg);
  return f.map((v, i) => Math.round(v * alpha + b[i] * (1 - alpha)));
};

const lum = (rgb) => {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const ratio = (fg, bg) => {
  const a = lum(over(fg, bg));
  const b = lum(toRgb(bg));
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
};

// [foreground token, background token, minimum, what it is]
const PAIRS = [
  ["ink", "bg", 4.5, "body text on the screen ground"],
  ["ink", "surface", 4.5, "body text on a card"],
  ["ink", "surfaceAlt", 4.5, "body text on the alt surface"],
  ["inkSoft", "surface", 4.5, "secondary text on a card"],
  ["muted", "surface", 4.5, "labels and meta on a card"],
  ["muted", "bg", 4.5, "labels on the screen ground"],
  ["accent", "surface", 4.5, "accent text on a card"],
  ["pos", "surface", 4.5, "a positive figure"],
  ["neg", "surface", 4.5, "a negative figure"],
  ["ctaInk", "cta", 4.5, "the label on a primary button"],
  ["onAccentFill", "accentFill", 4.5, "today's date on its marker"],
  ["anchorInk", "anchor", 4.5, "net pay on the dark card"],
  ["anchorMuted", "anchor", 4.5, "the caption on the dark card"],
  ["accentFill", "surface", 3, "the today marker itself (a non-text mark)"],
  ["border", "surface", 1.2, "a hairline, which only has to be visible"],
];

describe.each([
  ["light", lightTokens],
  ["dark", darkTokens],
])("%s palette meets WCAG AA", (name, tokens) => {
  test.each(PAIRS)("%s on %s ≥ %s:1 — %s", (fg, bg, min) => {
    const r = ratio(tokens[fg], tokens[bg]);
    // Reported to 2dp so a failure says how far short it fell.
    expect(Number(r.toFixed(2))).toBeGreaterThanOrEqual(min);
  });
});

describe("the shift-type dots stay visible on both grounds", () => {
  const { DOT_COLORS, resolveDot } = require("../utils/shiftColors");
  test.each(Object.keys(DOT_COLORS))("%s", (type) => {
    expect(
      ratio(resolveDot(type, "light"), lightTokens.surface),
    ).toBeGreaterThanOrEqual(2.5);
    expect(
      ratio(resolveDot(type, "dark"), darkTokens.surface),
    ).toBeGreaterThanOrEqual(2.5);
  });
});
