// Design tokens for the v2 redesign. Mirrored from
// docs/superpowers/specs/2026-05-22-visual-redesign-v2-design.md.
// Consumed by app/_layout.jsx — merged into MD3 light/dark themes so any
// useTheme() consumer can read theme.colors.<token>.

export const lightTokens = {
  bg: "#F7F7F5",
  surface: "#FFFFFF",
  surfaceAlt: "#EFEFEC",
  ink: "#16233F",
  inkSoft: "#4A5670",
  muted: "#6E7889",
  border: "rgba(22, 35, 63, 0.12)",
  borderSoft: "rgba(22, 35, 63, 0.07)",
  // `accent` is text-safe on surface (4.5:1); `accentFill` is the marker
  // colour, only ever used behind ctaInk or as a 3:1 non-text mark.
  accent: "#8A6A2F",
  accentFill: "#A8823C",
  accentSoft: "rgba(168, 130, 60, 0.12)",
  pos: "#17603F",
  neg: "#98301F",
  divider: "rgba(22, 35, 63, 0.07)",
  anchor: "#16233F",
  anchorInk: "#FFFFFF",
  anchorMuted: "rgba(255, 255, 255, 0.62)",
  cta: "#16233F",
  ctaInk: "#FFFFFF",
  tabActiveBg: "rgba(168, 130, 60, 0.14)",
};

// Not an inversion of the light set. Guards read this at 3am in a dim
// booth, so the ground is near-neutral rather than tinted navy: less
// emitted light, and the shift-type dots stay distinguishable on it.
export const darkTokens = {
  bg: "#121417",
  surface: "#1B1E23",
  surfaceAlt: "#232730",
  ink: "#EDEEF0",
  inkSoft: "#B4BAC4",
  muted: "#8D95A1",
  border: "rgba(237, 238, 240, 0.13)",
  borderSoft: "rgba(237, 238, 240, 0.07)",
  accent: "#D6AE63",
  accentFill: "#D6AE63",
  accentSoft: "rgba(214, 174, 99, 0.14)",
  pos: "#6FCB9F",
  neg: "#E2756A",
  divider: "rgba(237, 238, 240, 0.07)",
  anchor: "#232730",
  anchorInk: "#EDEEF0",
  anchorMuted: "rgba(237, 238, 240, 0.58)",
  cta: "#D6AE63",
  ctaInk: "#121417",
  tabActiveBg: "rgba(214, 174, 99, 0.16)",
};

// Older screens still read a few pre-v2 names. `card` and `editBtn` had
// no readers left and are gone.
export const legacyAlias = (t) => ({
  profileSection: t.cta,
  borderOutline: t.border,
  dateText: t.muted,
  delBtn: t.neg,
  summary: t.muted,
});

// Two shapes, not nine: a card and a control. `pill` is the one
// exception, for things that are genuinely round.
export const radius = {
  card: 14,
  control: 11,
  sheet: 20,
  pill: 999,
  fab: 27,
};

// One vertical rhythm. Every gap between sections is `section`, every
// card interior `cardV`/`cardH`, every screen gutter `screen`.
export const spacing = {
  screen: 20,
  section: 16,
  cardV: 16,
  cardH: 18,
  rowV: 14,
  rowH: 16,
  tight: 8,
};

// Generic font weights as strings for RN.
export const fw = {
  reg: "400",
  med: "500",
  sb: "600",
  bold: "700",
};

// Convert a hex (`#RRGGBB`) to `rgba(r, g, b, a)` for gradient stops.
// Strings already in `rgba(...)` form pass through unchanged so callers
// can pass `theme.colors.accent` regardless of the underlying token.
//
// Reason: stacking alpha by string concat (`accent + "33"`) yields
// 8-char hex which iOS RN accepts but some older Android RN builds
// reject silently. `rgba()` is universally supported.
export const withAlpha = (color, alpha) => {
  if (typeof color !== "string") return color;
  if (color.startsWith("rgba") || color.startsWith("rgb(")) return color;
  if (!color.startsWith("#")) return color;
  const hex =
    color.length === 4
      ? color
          .slice(1)
          .split("")
          .map((c) => c + c)
          .join("")
      : color.slice(1);
  if (hex.length !== 6) return color;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};
