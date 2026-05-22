# Design: Shift Colors + Per-Shift Comments

**Date:** 2026-05-22
**Branch:** `feat/shift-colors-and-comments`
**Status:** Approved for implementation planning

## Context

GuardPay's shift list (the `(tabs)/shifts` screen) renders every shift the same way — a Paper `Card` with date, time range, rate, and total. The user can't tell at a glance which entries are weekend shifts, training days, or holidays without reading the type or computing the day-of-week.

Two complementary features:

1. **Color-coded shift cards** — Friday, Saturday, Training, and Holiday shifts each get a light/pastel background tint. The user can customize which swatch each type uses.
2. **Per-shift comments** — a free-text note attached to a shift so the user can record context for themselves (e.g. "Mall, late shift", "covered for Yossi").

Both are quality-of-life additions; neither changes salary math, the cloud function, or the existing hour-bucket field-name contract.

## Constraints

- **Production app.** The Appwrite database has live users; all schema changes are additive only (see [CLAUDE.md](../../../CLAUDE.md)).
- **OTA-shipped.** `runtimeVersion.policy: "appVersion"` means a bad JS bundle hits installed devices on the next launch. JS-only changes must handle old documents (missing fields) without crashing.
- **Two-target stack.** Same code ships to iOS and Android; tinting and the swatch picker must work in both light and dark mode.
- **i18n.** All new user-facing strings get keys in both `en` and `he` blocks of `translations/vocabulary.js`. Arabic (`ar`) block is not yet translated; new keys can be added but won't be exposed until the locale is fully translated.

## Schema additions (manual — Appwrite console)

Both fields are **optional** so historical documents continue to load unchanged.

### `users_prefs.shift_colors`

- Type: `String`
- Max size: `200`
- Required: `false`
- Default: `null` (app falls back to defaults if absent)

Stored value is JSON, e.g.:

```json
{ "friday": "#E0F2FE", "saturday": "#EDE9FE", "training": "#DCFCE7", "holiday": "#FFE4D6" }
```

Only the light-mode hex is stored; the app resolves the dark-mode counterpart via a lookup table at render time. Keys missing from the JSON fall back to the default for that shift type.

### `shifts_history.comment`

- Type: `String`
- Max size: `500`
- Required: `false`
- Default: `null` (rendered as empty / "Add note")

No migration of existing documents is required.

## Color palette

Eight pastel swatches, each with a paired dark-mode hex. Stored as the light-mode hex in `users_prefs.shift_colors`; the dark counterpart is resolved by lookup table at render time.

| Name   | Light    | Dark     |
| ------ | -------- | -------- |
| Sky    | `#E0F2FE` | `#1E3A5F` |
| Mint   | `#DCFCE7` | `#14532D` |
| Peach  | `#FFE4D6` | `#4A2C2A` |
| Lilac  | `#EDE9FE` | `#2E1065` |
| Sand   | `#FEF3C7` | `#422006` |
| Blush  | `#FCE7F3` | `#500724` |
| Sage   | `#ECFCCB` | `#1A2E05` |
| Stone  | `#E5E7EB` | `#1F2937` |

Defaults assigned per shift type:

| Shift type | Default swatch |
| ---------- | -------------- |
| Friday     | Sky            |
| Saturday   | Lilac          |
| Training   | Mint           |
| Holiday    | Peach          |

Palette and defaults live in a new module `lib/shiftColors.js` (single source of truth — both the picker UI and the tinting logic import from here).

## Tint decision (per shift)

When rendering a `ShiftCard`, pick the tint with first-match-wins priority:

1. `shift.is_holiday` → holiday tint
2. `shift.is_training` → training tint
3. Local day of `shift.start_time` is Saturday (day 6 in `Date.getDay()`) → saturday tint
4. Local day of `shift.start_time` is Friday (day 5) → friday tint
5. Otherwise → no tint (card stays `theme.colors.surface`)

Rationale: a shift can be both training-on-Friday or holiday-on-Saturday; the user's intent in marking it training/holiday should win over the day-based classification.

**Calendar day vs. salary-weekend distinction.** The salary calculator treats "weekend" as Friday ≥ 16:00 through Sunday < 04:00 (the Israeli labor-law shabbat window). The card tint uses calendar day only (`Date.getDay()` on `start_time` in local time). This is intentional: tinting is a visual at-a-glance hint about which calendar day the shift falls on, not a re-derivation of the legal weekend window — so a shift starting Friday 09:00 (no shabbat pay) still tints as "Friday", and a shift starting Saturday 22:00 still tints as "Saturday".

## UI placement

### Profile → Appearance section (new)

A new `List.Section` between **Preferences** and **Reminder** on the Profile tab:

```
Appearance
├─ Friday tint     [●]    →
├─ Saturday tint   [●]    →
├─ Training tint   [●]    →
├─ Holiday tint    [●]    →
└─ Reset to defaults
```

- Each row shows the current swatch as a colored dot at the right edge.
- Tapping a row opens `<ShiftColorsModal>` (new component) with the 8 swatches in a grid + Cancel/Save buttons. Selected swatch is highlighted with a checkmark.
- "Reset to defaults" prompts a confirm dialog before wiping `shift_colors` back to the defaults.
- Save: persist updated JSON to `users_prefs.shift_colors` via `databases.updateDocument`, then `fetchUserProfile(user)` to refresh local state.

### Add/Edit Shift

Add a new field below the existing form (after `ShiftTypeSelected`, before `ShiftSummary`):

```
Note (optional)
[ TextInput, multiline, max 500 chars ]
```

- Uses Paper `TextInput` with `multiline numberOfLines={2}`, label `t("add_shift.note_label")`.
- Persisted into the new shift document on save (`docData.comment = comment.trim()`).
- When in edit mode (`params.existingData` present), pre-populates from `shiftData.comment ?? ""`.

### Shift Details

New "Note" section between the financial breakdown and the total `<View>`:

- If `shift.comment` is empty → render a `Button` with icon `note-plus` and text `t("shiftDetails.addNote")`. Tap → inline edit modal.
- If `shift.comment` is non-empty → render the note as `<Text variant="bodyLarge">` with an edit icon button to the right.
- Edit modal: full-screen sheet or `Portal` modal with `TextInput multiline maxLength={500}` + Save/Cancel. On save: `databases.updateDocument(... SHIFTS_HISTORY, shift.$id, { comment: trimmed })`, close modal, refresh local state.

### Shift Card

Two changes to the existing `ShiftCard.jsx`:

1. **Background tint** — apply the resolved tint via `style={{ backgroundColor: resolvedTint ?? theme.colors.surface }}`. Border color, text color, and other tokens stay as today; only the surface fill changes.
2. **Note indicator** — when `shift.comment?.length > 0`, render a small Material icon (`note-text-outline`) in the top-right corner of the card. No preview text.

## Component / module breakdown

| Path | Responsibility | Public API |
| ---- | -------------- | ---------- |
| `utils/shiftColors.js` (new, CommonJS) | Pure logic + palette constants. CJS to match the pattern of [utils/decimal.js](../../../utils/decimal.js) and [utils/salaryLogic.js](../../../utils/salaryLogic.js), so the Jest suite can `require()` it without a babel config. | `SWATCHES`, `DARK_MODE_LOOKUP`, `DEFAULT_COLORS`, `resolveTint(shift, userColors, colorScheme)`, `parseUserColors(json)`. |
| `lib/shiftColors.js` (new, ESM) | One-line re-export of the CJS helpers so app code imports from a single `lib/*` location. | `export * from "../utils/shiftColors"`. |
| `components/profile/AppearanceSection.jsx` (new) | The new `List.Section` rendered on Profile. | `<AppearanceSection />` (no props; reads from useAuth + useTheme). |
| `components/profile/ShiftColorsModal.jsx` (new) | The 8-swatch picker modal for one shift type. | `<ShiftColorsModal visible, onDismiss, currentColor, onSelect, title />`. |
| `components/shifts/ShiftCommentField.jsx` (new) | Multiline comment TextInput, used in Add/Edit Shift form. | `<ShiftCommentField value, onChangeText, maxLength=500 />`. |
| `components/shifts/ShiftNoteModal.jsx` (new) | Edit-comment modal launched from Shift Details. | `<ShiftNoteModal visible, onDismiss, shift, onSaved />`. |
| `components/shifts/ShiftCard.jsx` (existing — edit) | Apply tint to surface; render note icon when `shift.comment` is non-empty. | unchanged public API. |
| `app/add-shift.jsx` (existing — edit) | Read/write the `comment` field; pass through to `databases.updateDocument` / `createDocument`. | unchanged signature. |
| `app/shift-details.jsx` (existing — edit) | New Note section; manage the ShiftNoteModal. | unchanged. |
| `app/(tabs)/index.jsx` (existing — edit) | Add `AppearanceSection` between existing sections. | unchanged. |
| `translations/vocabulary.js` (existing — edit) | Add new `appearance.*`, `add_shift.note*`, `shiftDetails.note*`, `shiftDetails.addNote` keys to en + he. | unchanged. |

## Edge cases & robustness

- **No `shift_colors` field on the profile (old user, or first-time use)** → `parseUserColors(undefined)` returns the defaults object. No migration needed.
- **`shift_colors` field is not valid JSON (corruption / manual edit)** → `parseUserColors` catches `JSON.parse` error, returns defaults, logs once.
- **`shift_colors` is partial (e.g. only Friday set)** → defaults fill the missing entries.
- **User had a swatch chosen that's later removed from the palette** → resolved tint falls back to the default for that shift type.
- **`shift.comment` is `undefined` / `null`** → renders as empty / "Add note" CTA.
- **`shift.comment` is whitespace only** → trimmed on save; treated as empty thereafter.
- **i18n missing keys** → safe defaults shipped via the `||` fallback in `t()` calls (`t("shiftDetails.addNote") || "Add note"`).
- **Dark mode toggle while modal open** → tint preview redraws via `useColorScheme()` reactivity; no special handling.
- **RTL** — `I18nManager.forceRTL(false)` is global so no layout flip; new components use `flexDirection` with `isRTL ? "row-reverse" : "row"` for any horizontal lists.

## Testing

Pure-logic unit tests added to `__tests__/`:

- `shiftColors.test.js`:
  - `parseUserColors` — valid JSON, invalid JSON, partial object, null, undefined → returns merged defaults.
  - `resolveTint` — holiday wins over Saturday; training wins over Friday; non-special weekday returns `null`; respects user override; falls back to default when key missing from user colors; light vs dark hex returned correctly.

No new salary-logic tests required (this feature touches no salary math).

## Out of scope

- HSL color wheel / arbitrary user colors. Palette is fixed.
- Coloring the PDF paycheck. PDF remains uncolored.
- Comment search, filtering, or export.
- Note attachments (photos, links, location).
- Bulk edit of comments across multiple shifts.
- Comment history / audit log.
- Translation of `ar` block (tracked separately on the roadmap).

## Verification (after implementation)

End-to-end:

1. Update Appwrite schema with the two new optional attributes.
2. Open Profile → Appearance → change Friday tint to Blush. Save.
3. Verify a Friday shift on the shifts tab now shows the Blush tint.
4. Toggle system theme to dark. Confirm the tint reads correctly (dark counterpart from the lookup table).
5. Edit a shift → add a note "test note" → save. Card now shows `📝` icon.
6. Tap the shift → Shift Details shows "test note" with an edit button.
7. Tap edit → change to "updated" → save. Both Details and card icon reflect the update.
8. Create a brand-new test shift with no note. Confirm no `📝` icon, "Add note" CTA visible in Details.
9. Sign in as a different test user (no `shift_colors` field). Confirm defaults apply and no crash.
10. `npm test` — existing 32 tests + new `shiftColors.test.js` cases all pass.
