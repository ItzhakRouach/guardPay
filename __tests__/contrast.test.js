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
// `bg` may already be a resolved [r, g, b] triple, because a tinted
// background is itself flattened over a third colour first.
const over = (fg, bg) => {
  const a = String(fg).match(/rgba\([^)]*,\s*([\d.]+)\)/);
  if (!a) return toRgb(fg);
  const alpha = Number(a[1]);
  const f = toRgb(fg);
  const b = Array.isArray(bg) ? bg : toRgb(bg);
  return f.map((v, i) => Math.round(v * alpha + b[i] * (1 - alpha)));
};

const lum = (rgb) => {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// `under` is the opaque colour a translucent BACKGROUND sits on. A tinted
// chip (accentSoft, tabActiveBg) is itself see-through, so its effective
// colour has to be resolved before the foreground is measured against it.
const ratio = (fg, bg, under) => {
  const solidBg = under ? over(bg, under) : toRgb(bg);
  const a = lum(over(fg, solidBg));
  const b = lum(solidBg);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
};

// [foreground token, background token, minimum, what it is, background's
// own background when the background token is itself translucent]
//
// Every pair here is a combination the app actually renders. A token that
// is only ever used on one ground gets one row; `ctaInk` gets three,
// because the swipe actions reuse it on `neg` and on `accent`.
const PAIRS = [
  ["ink", "bg", 4.5, "body text on the screen ground", null],
  ["ink", "surface", 4.5, "body text on a card", null],
  ["ink", "surfaceAlt", 4.5, "body text on the alt surface", null],
  ["inkSoft", "surface", 4.5, "secondary text on a card", null],
  ["muted", "surface", 4.5, "labels and meta on a card", null],
  ["muted", "bg", 4.5, "labels on the screen ground", null],
  ["muted", "surfaceAlt", 4.5, "the inactive view-toggle label", null],
  ["accent", "surface", 4.5, "accent text on a card", null],
  ["accent", "accentSoft", 4.5, "a settings-row icon in its tint", "surface"],
  ["accent", "tabActiveBg", 4.5, "the active tab label", "bg"],
  ["pos", "surface", 4.5, "a positive figure", null],
  ["neg", "surface", 4.5, "a negative figure", null],
  ["ctaInk", "cta", 4.5, "the label on a primary button", null],
  ["ctaInk", "neg", 4.5, "the label on the delete swipe action", null],
  ["ctaInk", "accent", 4.5, "the label on the edit swipe action", null],
  ["onAccentFill", "accentFill", 4.5, "today's date on its marker", null],
  ["anchorInk", "anchor", 4.5, "net pay on the dark card", null],
  ["anchorMuted", "anchor", 4.5, "the caption on the dark card", null],
  ["accentFill", "surface", 3, "the today marker itself (a non-text mark)", null],
  ["border", "surface", 1.2, "a hairline, which only has to be visible", null],
];

describe.each([
  ["light", lightTokens],
  ["dark", darkTokens],
])("%s palette meets WCAG AA", (name, tokens) => {
  test.each(PAIRS)("%s on %s ≥ %s:1 — %s", (fg, bg, min, _what, under) => {
    const r = ratio(tokens[fg], tokens[bg], under && tokens[under]);
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
