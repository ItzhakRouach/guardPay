// Design tokens for the v2 redesign. Mirrored from
// docs/superpowers/specs/2026-05-22-visual-redesign-v2-design.md.
// Consumed by app/_layout.jsx — merged into MD3 light/dark themes so any
// useTheme() consumer can read theme.colors.<token>.

export const lightTokens = {
  bg: "#FAF7F2",
  surface: "#FFFFFF",
  surfaceAlt: "#F4EFE5",
  surfaceHi: "#FFFFFF",
  ink: "#1B2A4E",
  inkSoft: "#4B5A75",
  muted: "#8A8678",
  border: "rgba(27, 42, 78, 0.10)",
  borderSoft: "rgba(27, 42, 78, 0.06)",
  accent: "#B89968",
  accentSoft: "rgba(184, 153, 104, 0.12)",
  pos: "#1F6B4A",
  neg: "#A33B26",
  divider: "#ECE7DE",
  anchor: "#1B2A4E",
  anchorInk: "#FFFFFF",
  anchorMuted: "rgba(255, 255, 255, 0.6)",
  cta: "#1B2A4E",
  ctaInk: "#FFFFFF",
  tabActiveBg: "rgba(184, 153, 104, 0.16)",
};

export const darkTokens = {
  bg: "#0F1A2E",
  surface: "#18253E",
  surfaceAlt: "#1F2D49",
  surfaceHi: "#243352",
  ink: "#F4ECDC",
  inkSoft: "#B5BCCC",
  muted: "#758098",
  border: "rgba(244, 236, 220, 0.10)",
  borderSoft: "rgba(244, 236, 220, 0.05)",
  accent: "#C9A85C",
  accentSoft: "rgba(201, 168, 92, 0.14)",
  pos: "#7DD3A8",
  neg: "#E07566",
  divider: "rgba(244, 236, 220, 0.08)",
  anchor: "#08111F",
  anchorInk: "#F4ECDC",
  anchorMuted: "rgba(244, 236, 220, 0.55)",
  cta: "#C9A85C",
  ctaInk: "#0F1A2E",
  tabActiveBg: "rgba(201, 168, 92, 0.18)",
};

// Map legacy tokens to closest new equivalents so screens we haven't
// migrated yet keep rendering. Removed once every screen is on v2.
export const legacyAlias = (t) => ({
  card: t.surface,
  profileSection: t.cta,
  borderOutline: t.border,
  dateText: t.muted,
  editBtn: t.accent,
  delBtn: t.neg,
  summary: t.muted,
});

export const radius = {
  list: 18,
  banner: 18,
  sheet: 20,
  paycheckNet: 20,
  hero: 24,
  button: 14,
  buttonLg: 16,
  fab: 30,
  pill: 14,
};

export const spacing = {
  screen: 24,
  cardHero: 28,
  rowV: 16,
  rowH: 18,
  stack: 16,
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
  const hex = color.length === 4
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
