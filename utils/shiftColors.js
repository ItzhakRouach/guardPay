// Palette + tint-decision logic for shift cards.
//
// Kept as CommonJS so the Jest test suite can `require()` it directly
// without a babel config — matches the pattern of utils/decimal.js and
// utils/salaryLogic.js. App code imports from lib/shiftColors.js, which is
// a one-line ESM re-export of this module.

// Eight Tailwind-50 level swatches. The SAME hex is used in light and
// dark mode — Friday is always "Sky" regardless of system theme. Pale
// enough to sit comfortably on either a white or dark card surface.
const SWATCHES = [
  { name: "sky",   hex: "#F0F9FF" },
  { name: "mint",  hex: "#F0FDF4" },
  { name: "peach", hex: "#FFF7ED" },
  { name: "lilac", hex: "#F5F3FF" },
  { name: "sand",  hex: "#FEFCE8" },
  { name: "blush", hex: "#FDF2F8" },
  { name: "sage",  hex: "#F7FEE7" },
  { name: "stone", hex: "#F3F4F6" },
];

const DEFAULT_COLORS = {
  friday: "#F0F9FF",   // sky
  saturday: "#F5F3FF", // lilac
  training: "#F0FDF4", // mint
  holiday: "#FFF7ED",  // peach
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
//
// Priority (first match wins):
//   1. is_holiday → holiday tint
//   2. is_training → training tint
//   3. start_time falls on Saturday (local) → saturday tint
//   4. start_time falls on Friday (local) → friday tint
//   5. otherwise → null (caller falls back to theme.colors.surface)
const resolveTint = (shift, userColors) => {
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
  return colors[key] || DEFAULT_COLORS[key];
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
  DEFAULT_COLORS,
  parseUserColors,
  resolveTint,
  serialiseUserColors,
};
