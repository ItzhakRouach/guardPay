# GuardPay Visual Redesign v2 — Design Spec

**Date**: 2026-05-22
**Branch**: `feat/visual-redesign-v2`
**Worktree**: `.worktrees/redesign-v2`
**Source**: `~/Downloads/guardpay - new design/design_handoff_guardpay/`

## Goal

Adopt the full GuardPay redesign across every screen of the live app, with special focus on the new Overview tab and a brand-new on-screen Paycheck modal that drives a redesigned PDF export. No backend or salary-logic changes.

## Decisions Locked

| Topic | Decision |
|-------|---------|
| Scope | Full app redesign in one branch (auth + tabs + modals + PDF). |
| Fonts | `@expo-google-fonts/cormorant-garamond` (Latin + numerics) + `@expo-google-fonts/frank-ruhl-libre` (Hebrew serif) + `@expo-google-fonts/manrope` (UI sans). Loaded via `useFonts()` in root layout. |
| Auth screens | Restyle existing onBoarding/signIn/register/setupPrefs — no logic changes. |
| Paycheck | New full-screen modal route + redesigned PDF template, both rendered from a shared `lib/paycheckData.js`. |
| Motion | Subtle polish (hero number ticker, weekly bars fade-in, FAB press spring, sheet handle haptic). All gated on `AccessibilityInfo.isReduceMotionEnabled`. |

## Architecture

### Theme system
Extend the existing `lightTheme` / `darkTheme` objects in [app/_layout.jsx](../../app/_layout.jsx). Add new tokens directly onto `theme.colors`:

`bg`, `surface`, `surfaceAlt`, `surfaceHi`, `ink`, `inkSoft`, `muted`, `border`, `borderSoft`, `accent`, `accentSoft`, `pos`, `neg`, `divider`, `anchor`, `anchorInk`, `anchorMuted`, `cta`, `ctaInk`, `tabActiveBg`.

Legacy tokens (`card`, `profileSection`, `borderOutline`, `dateText`, `editBtn`, `delBtn`, `summary`) are aliased to the closest new token so untouched screens keep rendering during the rollout.

`theme.colors.primary` re-points to `cta` (navy in light, gold in dark) so MD3-based screens (Paper Button etc.) pick up the brand.

### Shared atoms (new `components/common/`)
- `Type.jsx` — variants: `hero`, `h1`, `h2`, `sectionTitle`, `eyebrow`, `body`, `label`, `numeric`, `yearItalic`, `helperItalic`, `button`. Family picker: Hebrew runes → Frank Ruhl Libre; otherwise Cormorant for serif variants and Manrope for UI variants. All numeric variants set `fontVariantNumeric: "tabular-nums"`.
- `Icon.jsx` — `react-native-svg` set mirroring the handoff: `sun, sunset, moon, briefcase, palm, plus, calendar, calendar-plus, clock, tag, chev-left, chev-right, list, chart, user, gear, check, document, share, bell, arrow-up, arrow-down, edit, trash, shield, lock, mail, sparkle`.
- `Eyebrow.jsx`, `Hairline.jsx`, `Monogram.jsx`, `Pill.jsx`, `PrimaryButton.jsx`, `OutlinedButton.jsx`, `IconButton.jsx`.
- `AnchorCard.jsx` — dark monthly banner with accent gradient strip on the inline-end edge.
- `HeroCard.jsx` — surface card with a faked radial-gradient corner (two `expo-linear-gradient` overlays at 45°/135°).

### Tab bar
Replace `expo-router/unstable-native-tabs` in [app/(tabs)/_layout.jsx](../../app/(tabs)/_layout.jsx) with the regular `Tabs` from `expo-router`, custom `tabBar` renderer. Order: Profile (gear) → Shifts (calendar-plus) → Overview (chart). Active pill: 14px radius, `tabActiveBg`, accent text/icon, weight 700. 82px height (8 top / 18 bottom safe area).

### Month navigation
Extract a small `hooks/useMonthNav.js` returning `{ currentDate, setCurrentDate, prev, next, label, eyebrow }`. Reused by Overview, Shifts, and the Paycheck modal. The existing `MonthPicker` is replaced inline in each header.

## Screens

### Overview ([app/(tabs)/overview.jsx](../../app/(tabs)/overview.jsx))
1. Header: `MONTHLY SUMMARY` eyebrow + serif `Month` + italic `Year`, chevron pair.
2. HeroCard: net-income label, serif 56px number, ₪ suffix, trend chip vs prior month (new `usePrevMonthNeto` hook).
3. Stats grid 2×2: bruto / total hours / shifts / deductions with 1px gridlines.
4. Weekly chart: 5 bars (W1–W5), `ink` bars, peak gets 4px `accent` cap. Bars fade-in 200ms.
5. Insights card: avg/shift, projected month, best day.
6. Generate Paycheck CTA → pushes `/paycheck` modal.

### Shifts ([app/(tabs)/shifts.jsx](../../app/(tabs)/shifts.jsx))
1. Header: `N SHIFTS · X HOURS` eyebrow + serif month + chevrons.
2. AnchorCard: gross + travel | total hours.
3. Grouped sections "WEEK 1/2/3/4/5" — each one card with internal hairlines.
4. ShiftCard row: 44px left day column (weekday small uppercase + serif 24 day), vertical hairline, middle (type icon + label + meta), amount on right (serif 19 + ₪).
5. FAB 60×60, inline-end positioning, spring press.

### Add / Edit shift ([app/add-shift.jsx](../../app/add-shift.jsx))
- Drag handle, title row with Cancel ghost / serif title / trash (edit-only).
- White form card (20px radius): Date row, Start | End grid with vertical divider, Hourly rate row. Icons from the new set. Existing pickers (`ShiftDatePicker`, `DateTimeModal`) keep their behavior.
- Shift-type tile grid (3 cols × 2 rows: Morning, Evening, Night, Training, Vacation, Shabbat). Filled `ink` when active.
- SurfaceAlt summary tile (total hours | shift gross).
- Save: full-width `cta` with check icon.

### Paycheck (NEW `app/paycheck.jsx`)
- Stack screen with `presentation: "modal"`.
- Receives current month + minimal params via `router.push`; re-runs `useShift` + `useMonthlySalary` internally so data is fresh.
- Sticky header: back / `PAYCHECK` eyebrow / share.
- Letterhead: `GUARDPAY` eyebrow, `Pay Statement` serif, italic `Month Year`, employee identity line.
- Earnings table (Item / Rate / Qty / Amount) + 1.5px `ink` rule + italic Gross total.
- Deductions table (accent variant): Income tax, Health & social, Pension.
- Net pay anchor card with accent strip, serif 44 number, italic helper.
- Actions: Export PDF (calls `handleGeneratePDF`) + Share.

### Profile ([app/(tabs)/index.jsx](../../app/(tabs)/index.jsx))
- `ACCOUNT` eyebrow + serif name + email.
- Stats 2-col: Active months / Total shifts.
- Settings rows (default rate, shift reminders, dark-mode toggle, language pill).
- Legal section: Labor regulations / Collective agreements / Privacy & security.
- Sign out outlined `neg` text.

### Auth
Restyle [(auth)/onBoarding.jsx](../../app/(auth)/onBoarding.jsx), [signIn.jsx](../../app/(auth)/signIn.jsx), [register.jsx](../../app/(auth)/register.jsx), [setupPrefs.jsx](../../app/(auth)/setupPrefs.jsx). New monogram + serif title + italic subtitle + pitch paragraph + stacked CTAs + EN/HE pill. **All Appwrite calls, OAuth flows, and the `users_prefs` write are untouched.**

## Shared data layer

`lib/paycheckData.js` — extracts the earnings aggregation, deductions split, and net-pay calculation currently inlined in [lib/GeneratePaycheck.js](../../lib/GeneratePaycheck.js). Both the modal and the PDF template consume it. The `HOUR_TYPES` constant moves here. The cloud-function-mirrored `utils/salaryLogic.js` is **not** touched.

## PDF template

Rewrite the HTML inside [lib/GeneratePaycheck.js](../../lib/GeneratePaycheck.js). Same signature `handleGeneratePDF(totals, profile, currentDate, shifts, monthlyReport)`, same aggregation, but:
- Cormorant Garamond + Frank Ruhl Libre + Manrope via `<link>` Google Fonts.
- Letterhead block, earnings + deductions tables, anchor net-pay card.
- A4 layout, LTR direction (Hebrew row labels remain Hebrew inline).

## i18n

Add keys under both `en` and `he` in [translations/vocabulary.js](../../translations/vocabulary.js):
- `overview.*` — `heroLabel`, `stats.*`, `weekly`, `insights.*`, `cta`
- `shifts.*` — `anchor.*`, `weekSection`, `empty`
- `paycheck.*` — `title`, `earnings`, `deductions`, `netPay`, `export`, `share`, `helper`
- `welcome.*` — `eyebrow`, `subtitle`, `pitch`, `secured`
- `profile.*` — `eyebrow`, `activeMonths`, `totalShifts`, `darkMode`, `language`, `legal.*`

## Risks

- **Tab bar swap** loses iOS native haptics; we accept that for pixel control.
- **Font bundle** adds ~300–500 KB to JS bundle; OTA-safe but worth testing on slow networks.
- **No salary-logic changes** — cloud function `697d0f3c001bba7f03d2` and `utils/salaryLogic.js` stay byte-identical.
- **Shabbat tile** in the add-sheet — handoff lists 5 types but the app has 6; we render a 6th tile.
- `expo-font` startup delay ~150ms — keep existing `LoadingSpinner`.

## Verification

- `npm test` — salary numbers locked.
- `npm run lint` — clean.
- iOS dev client manual QA: light + dark, EN + HE, empty-month state, real shifts with holiday flag, PDF export & share.
- Visual diff vs prototype HTML for HeroCard, AnchorCard, Net pay card, sheet form card.

## Out of scope

- Real authentication redesign (signin / OAuth screens are restyled, flows untouched).
- Multi-employer support.
- New onboarding for default-rate collection (separate spec).
- 2026 tax bracket reconciliation (tracked in memory `pending-followups.md`).
