# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Production app — handle with care

GuardPay is **live on the App Store** (`com.itzhakrouach.guardpay`; the shipping version is `version` in [app.json](app.json)) with real users whose financial history lives in Appwrite project `69583540003a5151db86`. Treat the database and cloud functions as production resources.

- **Never delete or rename** existing fields on `shifts_history` or `users_prefs`. Add only optional fields, with safe defaults for historical documents.
- **Never break the hour-bucket field-name contract** (see "Cross-file field-name contract" below) — historical shift documents depend on those exact names.
- **Salary math now runs client-side in [utils/salaryLogic.js](utils/salaryLogic.js); changes there hit every user's monthly neto immediately via OTA.** Run `npm test`, use the `salary-logic-guardian` subagent, and ask the user before shipping. (The `CALCULATE_SALARY` cloud function `697d0f3c001bba7f03d2` is no longer on the hot path and, since the weekly-overtime rules, no longer a faithful mirror — it remains deployed only for `DELETE_ACCOUNT`.)
- **OTA updates ship without App Store review** because `runtimeVersion.policy: "appVersion"` is set in `app.json`. A bad JS bundle hits installed devices on the next launch.
- **Don't run migrations or backfills** against the live Appwrite project without an approved dry-run plan. Ask the user to spin up a staging project for risky work.

## Commands

- `npm start` — Expo dev server (Metro)
- `npm run ios` / `npm run android` — native dev build (`expo run:*`, needs a dev client; `expo-dev-client` is installed)
- `npm run web` — web target
- `npm run lint` — `expo lint` (flat config at [eslint.config.js](eslint.config.js))
- `npm test` — Jest. Run a single test: `npx jest -t "Weekday morning shift - 8 Hours"` or `npx jest __tests__/salary.test.js`
- EAS profiles (dev / preview / production) live in [eas.json](eas.json); iOS submit is wired up.

## Architecture

Expo Router file-based routing under [app/](app/) with three groups:
- `(auth)` — onboarding / signin / register / `setupPrefs`
- `(tabs)` — Profile (`index`), `shifts`, `overview`, rendered with expo-router `Tabs` and a hand-rolled JS tab bar in [app/(tabs)/_layout.jsx](app/(tabs)/_layout.jsx) (`react-native-bottom-tabs` is installed but unused)
- Top-level modal route `add-shift`

[app/_layout.jsx](app/_layout.jsx) wires `LanguageProvider → ThemeProvider → AuthProvider → ShiftsProvider → PaperProvider → SafeAreaProvider → RouteGuard → ErrorBoundary → Stack (+ UpdateBanner)`. `RouteGuard` enforces: no user → `/onBoarding`; signed-in user without a profile doc → `/setupPrefs`; otherwise → `(tabs)`. `experiments.reactCompiler` and `typedRoutes` are on in [app.json](app.json).

### Backend (Appwrite)

[lib/appwrite.js](lib/appwrite.js) exports a `react-native-appwrite` client with `Account`, `Databases`, `Functions`. Two collections are in active use: `users_prefs` (profile/preferences) and `shifts_history` (one document per shift; the single realtime subscription lives in [hooks/shifts-store.js](hooks/shifts-store.js) on `databases.<DB>.collections.shifts_history.documents`, and the single `users_prefs` subscription in [hooks/auth-context.js](hooks/auth-context.js)).

Two Appwrite Functions are invoked by hard-coded ID from the client — keep these in sync with the Appwrite console:
- `697d0f3c001bba7f03d2` — `CALCULATE_SALARY` / `CALCULATE_SHIFT` (salary math, **now computed client-side** — this function is bypassed except for its `DELETE_ACCOUNT` action, called from [app/(tabs)/index.jsx](app/(tabs)/index.jsx))
- `697d1855002cf9854228` — Apple Sign-In token exchange, called from [hooks/auth-context.js](hooks/auth-context.js)

OAuth: Google uses `account.createOAuth2Token` + `WebBrowser.openAuthSessionAsync` with redirect scheme `appwrite-callback-69583540003a5151db86://` (matches `scheme` in [app.json](app.json)). Apple uses native `AppleAuthentication` → the function above → `account.createSession`.

### Salary pipeline (the core of the app)

`useShift(user, currentDate)` reads the month's shifts from the shared store in [hooks/shifts-store.js](hooks/shifts-store.js) (one cached fetch per month, one user-scoped realtime subscription per signed-in user, events coalesced per month) → `useMonthlySalary(shifts)` aggregates locally and computes `{ bruto, neto, totalDeductions, ... }` **client-side** (rendered in [app/(tabs)/overview.jsx](app/(tabs)/overview.jsx)). The per-shift breakdown is likewise computed client-side in [app/add-shift.jsx](app/add-shift.jsx) before the document is written.

**Salary math runs entirely on the client.** [utils/salaryLogic.js](utils/salaryLogic.js) (CommonJS, covered by [__tests__/salary.test.js](__tests__/salary.test.js)) is the **single source of truth** — it exports `calculateSalary`, `calculateShiftPay`, and `computeShiftDoc` (the shift-document builder, including the training/vacation flat `baseRate×8` rule). [lib/salaryLogic.js](lib/salaryLogic.js) is a **thin ESM re-export** of it (same pattern as `lib/shiftType.js`), which app code imports.

`calculateShiftPay` takes an optional `rules` argument (weekly 42 h cap, 8 / 8.6 daily norm, midnight split — see `utils/overtimeRules.js`, `utils/weeklyOt.js`, and the spec `docs/superpowers/specs/2026-09-27-weekly-overtime-design.md`). With `rules` omitted it is **byte-identical to the historical function** (test-locked in `__tests__/weeklyOt.test.js`). The `CALCULATE_SALARY` / `CALCULATE_SHIFT` cloud function (`697d0f3c001bba7f03d2`) is **retired as a rollback path** — it has no weekly context — and remains deployed only for `DELETE_ACCOUNT`. Week context is injected at write time (`app/add-shift.jsx`; delete in `app/(tabs)/shifts.jsx`) and on rule changes (`components/profile/OvertimeSettingsModal.jsx` → `recomputeRange`, **the weeks overlapping the current month, each whole**; two devices saving in the same week last-writer-wins until the next recompute). Per-user rules live in the optional `users_prefs.overtime_rules` JSON string; a shift computed under the weekly rule carries the optional `weekly_regular_before` field. When changing salary rules, update **`utils/salaryLogic.js`**, run `npm test`, and use the `salary-logic-guardian` subagent.

Encoded business rules (Israeli labor law, 2026 values):
- 15-min granularity throughout.
- Night shift = ≥2 hours between 22:00–06:00 → regular-hour cap drops from 8 → 7.
- Weekend window = Friday ≥16:00 through Sunday <04:00 (`getSundayCutoff` splits cross-Sunday shifts).
- OT brackets: weekday 125% (first 2 OT hours) / 150% (after); weekend equivalents 175% / 200%; holiday flag forces the special-pay path for the whole shift.
- Monthly deductions in `calculateSalary`: pensia 7% / 7% / 5% (regular/extra/travel), Bituah Leumi tiered at 7522 ₪ (3.5% / 12%), income-tax brackets, credit points × 242 ₪, optional settlement benefit capped monthly via [utils/settlements.json](utils/settlements.json) (per-village `{ percent, annualCap }`).

All thresholds and constants are test-locked — don't refactor numbers without running `npm test`.

### Cross-file field-name contract

The salary calculator emits — and the Appwrite shifts collection, [utils/monthlyTotals.js](utils/monthlyTotals.js) (the reducer behind `useMonthlySalary`), and [lib/paycheckData.js](lib/paycheckData.js) `HOUR_TYPES` (imported by [lib/GeneratePaycheck.js](lib/GeneratePaycheck.js), so the modal and the PDF share one table) all read — **nine** hour-bucket field names: `h100_hours`, `h125_extra_hours`, `h150_extra_hours`, `h150_shabat`, `h175_extra_hours`, `h200_extra_hours`, `h150_holiday`, `h175_holiday`, `h200_holiday`, plus `reg_pay_amount`, `extra_pay_amount`, `travel_pay_amount`, `total_amount`. Adding a new pay bracket means updating all of them.

The nine are **three pairs plus three singles**: `calculateShiftPay` fills either `h150_shabat`/`h175_extra_hours`/`h200_extra_hours` (Shabbat) **or** `h150_holiday`/`h175_holiday`/`h200_holiday` (חג), never both — so readers sum both sets and still count once. Every reader must cover all nine: omitting the three `*_holiday` fields is what made חג shifts contribute full pay and **zero hours** to the month total for months. The invariant is test-locked in [__tests__/salary.test.js](__tests__/salary.test.js): the nine buckets always sum to `reg_hours + extra_hours`.

A חג shift imported from מִשְׁמֶרֶת is a third case: the Appwrite function folds its holiday buckets into the Shabbat ones before writing, so it carries `is_holiday` **and** `h150_shabat`. Labels therefore key off `is_holiday`, never off which field holds the hours.

Day-type flags on `shifts_history` (mutually exclusive — only one is true per document): `is_training`, `is_vacation`, `is_sick`, `is_holiday`. Sick docs additionally carry `sick_percent` (0 / 0.5 / 1.0) used by the PDF to bucket rows. Sick-day math is computed in [utils/sickDays.js](utils/sickDays.js): `useMonthlySalary` passes the precomputed `sick_pay` sum into `calculateSalary`, which adds it to bruto + 7% pension but does not know about the streak rule.

[lib/GeneratePaycheck.js](lib/GeneratePaycheck.js) builds an HTML payslip and renders to PDF via `expo-print` + `expo-sharing`. [lib/notfication.js](lib/notfication.js) (filename typo — keep it) schedules the weekly reminder via `expo-notifications`.

### Data layer & resilience conventions

- Pure logic lives in `utils/*.js` as **CommonJS** (Jest requires it without babel config); app code imports the thin ESM re-export in `lib/*.js`. New logic follows the same pair (`utils/shiftBreakdown.js` ↔ `lib/shiftBreakdown.js`, etc.).
- Never call `databases.listDocuments` with a bare `Query.limit(N)` for a user's data; use `listAllDocuments` in [lib/appwriteList.js](lib/appwriteList.js) (cursor pagination).
- Every document sum that feeds a money figure goes through `docBruto` in [utils/monthlyTotals.js](utils/monthlyTotals.js) (training-day travel is stored beside `total_amount`).
- Backend errors are classified by [utils/appwriteErrors.js](utils/appwriteErrors.js); a paused/unreachable Appwrite shows `components/layout/ServiceUnavailable.jsx` rather than onboarding. The Appwrite Free-plan pause and the keep-alive workflow are documented in [docs/ops/appwrite-keepalive.md](docs/ops/appwrite-keepalive.md).
- OTA: `hooks/useOtaUpdates.js` checks on foreground and `components/layout/UpdateBanner.jsx` offers a restart; `components/layout/ErrorBoundary.jsx` wraps the Stack.
- A month's shape and its per-day buckets come from [utils/monthGrid.js](utils/monthGrid.js) — the calendar grid, the Shifts week grouping and the Overview chart all read it, so they cannot drift. Do not write a fourth copy of the week arithmetic.

## i18n & RTL

`react-i18next` with `he`, `en` and `ar` vocabularies in [translations/vocabulary.js](translations/vocabulary.js) — every new key must land in all three blocks. Selected language persists in `AsyncStorage` under `user-language` via [hooks/lang-context.js](hooks/lang-context.js); with no saved choice the default follows the phone (`utils/defaultLanguage.js`). Use the `arabic-localizer` subagent to review Arabic copy.

**Layout direction (changed in the v3 redesign).** One `View` at the app root in [app/_layout.jsx](app/_layout.jsx) sets the Yoga `direction` style (`rtl` for `he`/`ar`), and it propagates through every subtree including react-native-paper's portals. **Write plain `flexDirection: "row"`** — it mirrors itself. The 52 `flexDirection: isRTL ? "row-reverse" : "row"` flips that used to do this by hand are gone, and reintroducing one would double-flip that row. Use the logical `start`/`end` insets rather than `left`/`right` (see the FAB in `app/(tabs)/shifts.jsx`).

`I18nManager.forceRTL` stays **false** on purpose: it is a native, app-restart switch that can leave a launch half-flipped, whereas the `direction` style is per-subtree and applies on the next render. `isRTL` from `useLanguage()` is still the right thing for text alignment and for `alignSelf`, which Yoga direction does not cover.

## Theming

One typeface: **IBM Plex Sans Hebrew** (Hebrew, Latin and the figures) with **IBM Plex Sans Arabic** as its sibling, eight faces, loaded in [app/_layout.jsx](app/_layout.jsx). [components/common/Type.jsx](components/common/Type.jsx) owns the scale; no variant is uppercase or italic. Money variants set `tabular-nums`.

`app/_layout.jsx` also calls Paper's `configureFonts` and sets `roundness`, which is how the ~25 react-native-paper files inherit the redesign without being rewritten. Paper stays the interaction layer (TextInput, Modal, Switch, SegmentedButtons); the custom primitives have no equivalent.

Colour, shape and rhythm are the token sets in [lib/theme.js](lib/theme.js): `bg`, `surface`, `surfaceAlt`, `ink`, `inkSoft`, `muted`, `border`, `borderSoft`, `accent`, `accentFill`, `onAccentFill`, `accentSoft`, `pos`, `neg`, `divider`, `anchor`, `anchorInk`, `anchorMuted`, `cta`, `ctaInk`, `tabActiveBg`, plus `radius` and `spacing`. Dark is not an inversion of light: the ground is near-neutral so the app emits less light on a night shift. Read `theme.colors.<token>` from `useTheme()` and the `radius`/`spacing` maps from `lib/theme`; never hardcode a hex or a one-off radius.

**[__tests__/contrast.test.js](__tests__/contrast.test.js) enforces WCAG AA on every foreground/background token pair in both modes.** Changing a colour without running it is how an unreadable label ships. `accentFill` in particular is pinned between two thresholds: 3:1 against white so the today-marker is visible, and 4.5:1 under `onAccentFill` so the date on it is readable.

## Environment variables

All keys are `EXPO_PUBLIC_*`, which means they are **shipped to the client bundle** — never put secrets here. Defined in `.env`:

- `EXPO_PUBLIC_APPWRITE_ENDPOINT`, `EXPO_PUBLIC_APPWRITE_PROJECT_ID`, `EXPO_PUBLIC_APPWRITE_PLATFORM`
- `EXPO_PUBLIC_APPWRITE_DB`
- `EXPO_PUBLIC_APPWRITE_USERS_PREFS_ID` (`users_prefs` collection)
- `EXPO_PUBLIC_APPWRITE_SHIFTS_HISTORY_ID` (`shifts_history` collection)
