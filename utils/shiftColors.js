// Palette + tint-decision logic for shift cards.
//
// Kept as CommonJS so the Jest test suite can `require()` it directly
// without a babel config — matches the pattern of utils/decimal.js and
// utils/salaryLogic.js. App code imports from lib/shiftColors.js, which is
// a one-line ESM re-export of this module.

// Light-mode hex is the canonical/stored value. Each swatch has a paired
// dark-mode hex resolved at render time via DARK_MODE_LOOKUP.
const SWATCHES = [
  { name: "sky",   light: "#E0F2FE", dark: "#1E3A5F" },
  { name: "mint",  light: "#DCFCE7", dark: "#14532D" },
  { name: "peach", light: "#FFE4D6", dark: "#4A2C2A" },
  { name: "lilac", light: "#EDE9FE", dark: "#2E1065" },
  { name: "sand",  light: "#FEF3C7", dark: "#422006" },
  { name: "blush", light: "#FCE7F3", dark: "#500724" },
  { name: "sage",  light: "#ECFCCB", dark: "#1A2E05" },
  { name: "stone", light: "#E5E7EB", dark: "#1F2937" },
];

const DARK_MODE_LOOKUP = SWATCHES.reduce((acc, s) => {
  acc[s.light.toUpperCase()] = s.dark;
  return acc;
}, {});

const DEFAULT_COLORS = {
  friday: "#E0F2FE",   // sky
  saturday: "#EDE9FE", // lilac
  training: "#DCFCE7", // mint
  holiday: "#FFE4D6",  // peach
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

// Pick the right tint for a single shift. Returns the resolved hex string
// (light or dark depending on colorScheme), or null if no tint applies.
//
// Priority (first match wins):
//   1. is_holiday → holiday tint
//   2. is_training → training tint
//   3. start_time falls on Saturday (local) → saturday tint
//   4. start_time falls on Friday (local) → friday tint
//   5. otherwise → null (caller falls back to theme.colors.surface)
const resolveTint = (shift, userColors, colorScheme) => {
  if (!shift) return null;
  const colors = parseUserColors(userColors);
  let key = null;

  if (shift.is_holiday) {
    key = "holiday";
  } else if (shift.is_training) {
    key = "training";
  } else if (shift.start_time) {
    const day = new Date(shift.start_time).getDay();
    if (day === 6) key = "saturday";
    else if (day === 5) key = "friday";
  }

  if (!key) return null;
  const lightHex = (colors[key] || DEFAULT_COLORS[key]).toUpperCase();
  if (colorScheme === "dark") {
    return DARK_MODE_LOOKUP[lightHex] || lightHex;
  }
  return lightHex;
};

// Serialise a colors object back to the JSON string we store in Appwrite.
// Only persists keys whose value differs from the default — keeps the
// stored blob small and lets us add new defaults later without forcing a
// migration of stored profiles.
const serialiseUserColors = (colors) => {
  const diff = {};
  for (const key of Object.keys(DEFAULT_COLORS)) {
    if (colors[key] && colors[key].toUpperCase() !== DEFAULT_COLORS[key].toUpperCase()) {
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
  serialiseUserColors,
};
