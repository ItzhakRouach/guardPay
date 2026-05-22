// Palette + tint-decision logic for shift cards.
//
// Kept as CommonJS so the Jest test suite can `require()` it directly
// without a babel config — matches the pattern of utils/decimal.js and
// utils/salaryLogic.js. App code imports from lib/shiftColors.js, which is
// a one-line ESM re-export of this module.

// Each swatch has a single identity (`name`) but two rendered values:
// `light` for white-card surfaces and `dark` for the dark theme's card
// surface (#163059ff). Light values sit at Tailwind-50 for a barely-there
// wash; dark values are muted tints — close to the surface lightness so
// they don't fight the white text but with enough hue to read as the
// same swatch family.
//
// Storage in users_prefs.shift_colors uses the LIGHT hex as the
// canonical identifier. The dark counterpart is looked up at render time
// via DARK_MODE_LOOKUP. If a stored hex isn't in the palette (e.g. a
// future palette change), the light hex is returned unchanged.
const SWATCHES = [
  { name: "sky",   light: "#F0F9FF", dark: "#243345" },
  { name: "mint",  light: "#F0FDF4", dark: "#243A2F" },
  { name: "peach", light: "#FFF7ED", dark: "#3A2D22" },
  { name: "lilac", light: "#F5F3FF", dark: "#2D2A40" },
  { name: "sand",  light: "#FEFCE8", dark: "#3A3322" },
  { name: "blush", light: "#FDF2F8", dark: "#3D2632" },
  { name: "sage",  light: "#F7FEE7", dark: "#2D3A22" },
  { name: "stone", light: "#F3F4F6", dark: "#2A2D34" },
];

const DARK_MODE_LOOKUP = SWATCHES.reduce((acc, s) => {
  acc[s.light.toUpperCase()] = s.dark;
  return acc;
}, {});

const DEFAULT_COLORS = {
  friday: "#F0F9FF",   // sky
  saturday: "#F5F3FF", // lilac
  training: "#F0FDF4", // mint
  holiday: "#FFF7ED",  // peach
  sick: "#FDF2F8",     // blush
};

// Resolve a stored (light) hex to the colour we should actually paint.
// `scheme` is "light" or "dark"; in dark mode we swap to the swatch's
// dark counterpart. Off-palette colours (e.g. legacy stored values)
// pass through unchanged.
const resolveSwatchHex = (lightHex, scheme) => {
  if (!lightHex) return lightHex;
  if (scheme !== "dark") return lightHex;
  return DARK_MODE_LOOKUP[lightHex.toUpperCase()] || lightHex;
};

// Safe parse: returns a complete `{friday, saturday, training, holiday}`
// object with defaults filling missing keys. Tolerates undefined, null,
// invalid JSON, and partial objects.
const parseUserColors = (raw) => {
  if (raw === undefined || raw === null || raw === "") {
    return { ...DEFAULT_COLORS };
  }
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== "object") return { ...DEFAULT_COLORS };
    return { ...DEFAULT_COLORS, ...parsed };
  } catch {
    return { ...DEFAULT_COLORS };
  }
};

// Pick the tint hex for a single shift, or null if no tint applies.
// `scheme` should be "light" or "dark" (the user's resolved theme); the
// returned hex is the per-scheme value, not the stored canonical one.
//
// Priority (first match wins):
//   1. is_holiday → holiday tint
//   2. is_sick → sick tint
//   3. is_training → training tint
//   4. start_time falls on Saturday (local) → saturday tint
//   5. start_time falls on Friday (local) → friday tint
//   6. otherwise → null (caller falls back to theme.colors.surface)
const resolveTint = (shift, userColors, scheme) => {
  if (!shift) return null;
  const colors = parseUserColors(userColors);
  let key = null;

  if (shift.is_holiday) {
    key = "holiday";
  } else if (shift.is_sick) {
    key = "sick";
  } else if (shift.is_training) {
    key = "training";
  } else if (shift.start_time) {
    const day = new Date(shift.start_time).getDay();
    if (day === 6) key = "saturday";
    else if (day === 5) key = "friday";
  }

  if (!key) return null;
  return resolveSwatchHex(colors[key] || DEFAULT_COLORS[key], scheme);
};

// Serialise a colors object back to the JSON string we store in Appwrite.
// Only persists keys whose value differs from the default — keeps the
// stored blob small and lets us add new defaults later without forcing a
// migration of stored profiles.
const serialiseUserColors = (colors) => {
  const diff = {};
  for (const key of Object.keys(DEFAULT_COLORS)) {
    if (
      colors[key] &&
      colors[key].toUpperCase() !== DEFAULT_COLORS[key].toUpperCase()
    ) {
      diff[key] = colors[key];
    }
  }
  return JSON.stringify(diff);
};

module.exports = {
  SWATCHES,
  DARK_MODE_LOOKUP,
  DEFAULT_COLORS,
  parseUserColors,
  resolveTint,
  resolveSwatchHex,
  serialiseUserColors,
};
