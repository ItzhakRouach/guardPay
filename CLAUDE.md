# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Production app — handle with care

GuardPay is **live on the App Store** (`com.itzhakrouach.guardpay`, currently 1.2.1) with real users whose financial history lives in Appwrite project `69583540003a5151db86`. Treat the database and cloud functions as production resources.

- **Never delete or rename** existing fields on `shifts_history` or `users_prefs`. Add only optional fields, with safe defaults for historical documents.
- **Never break the hour-bucket field-name contract** (see "Cross-file field-name contract" below) — historical shift documents depend on those exact names.
- **`CALCULATE_SALARY` (function `697d0f3c001bba7f03d2`) changes hit every user's monthly neto immediately.** Run `npm test`, use the `salary-logic-guardian` subagent, and ask the user before deploying.
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
- `(tabs)` — Profile (`index`), `shifts`, `overview`, rendered with native iOS tabs (`expo-router/unstable-native-tabs`)
- Top-level modal route `add-shift`

[app/_layout.jsx](app/_layout.jsx) wires `LanguageProvider → AuthProvider → PaperProvider → SafeAreaProvider → RouteGuard → Stack`. `RouteGuard` enforces: no user → `/onBoarding`; signed-in user without a profile doc → `/setupPrefs`; otherwise → `(tabs)`. `experiments.reactCompiler` and `typedRoutes` are on in [app.json](app.json).

### Backend (Appwrite)

[lib/appwrite.js](lib/appwrite.js) exports a `react-native-appwrite` client with `Account`, `Databases`, `Functions`. Two collections are in active use: `users_prefs` (profile/preferences) and `shifts_history` (one document per shift, with realtime subscription in [hooks/useShift.js](hooks/useShift.js) on `databases.<DB>.collections.shifts_history.documents`).

Two Appwrite Functions are invoked by hard-coded ID from the client — keep these in sync with the Appwrite console:
- `697d0f3c001bba7f03d2` — `CALCULATE_SALARY`, called from [hooks/useMonthlySalary.js](hooks/useMonthlySalary.js)
- `697d1855002cf9854228` — Apple Sign-In token exchange, called from [hooks/auth-context.js](hooks/auth-context.js)

OAuth: Google uses `account.createOAuth2Token` + `WebBrowser.openAuthSessionAsync` with redirect scheme `appwrite-callback-69583540003a5151db86://` (matches `scheme` in [app.json](app.json)). Apple uses native `AppleAuthentication` → the function above → `account.createSession`.

### Salary pipeline (the core of the app)

`useShift(user, currentDate)` fetches the month's shifts → `useMonthlySalary(shifts)` aggregates locally then calls the `CALCULATE_SALARY` cloud function to produce `{ bruto, neto, totalDeductions, ... }` rendered by `components/overview/MonthSummary`.

**There are two copies of the salary logic** — this duplication is intentional but fragile:
- [lib/salaryLogic.js](lib/salaryLogic.js) — ESM, used by the app at runtime (per-shift breakdown).
- [utils/salaryLogic.js](utils/salaryLogic.js) — CommonJS, **mirrors the Appwrite cloud function** and is what [__tests__/salary.test.js](__tests__/salary.test.js) covers. Adds `isHoliday`, `settlementPercent`/`settlementAnnualCap`, and `creditPoints`.

When changing salary rules, update **both** files **and** the cloud function, then run `npm test`.

Encoded business rules (Israeli labor law, 2026 values):
- 15-min granularity throughout.
- Night shift = ≥2 hours between 22:00–06:00 → regular-hour cap drops from 8 → 7.
- Weekend window = Friday ≥16:00 through Sunday <04:00 (`getSundayCutoff` splits cross-Sunday shifts).
- OT brackets: weekday 125% (first 2 OT hours) / 150% (after); weekend equivalents 175% / 200%; holiday flag forces the special-pay path for the whole shift.
- Monthly deductions in `calculateSalary`: pensia 7% / 7% / 5% (regular/extra/travel), Bituah Leumi tiered at 7522 ₪ (3.5% / 12%), income-tax brackets, credit points × 242 ₪, optional settlement benefit capped monthly via [utils/settlements.json](utils/settlements.json) (per-village `{ percent, annualCap }`).

All thresholds and constants are test-locked — don't refactor numbers without running `npm test`.

### Cross-file field-name contract

The salary calculator emits — and the Appwrite shifts collection, [hooks/useMonthlySalary.js](hooks/useMonthlySalary.js), and [lib/GeneratePaycheck.js](lib/GeneratePaycheck.js) all read — the same hour-bucket field names: `h100_hours`, `h125_extra_hours`, `h150_extra_hours`, `h150_shabat`, `h175_extra_hours`, `h200_extra_hours`, plus `reg_pay_amount`, `extra_pay_amount`, `travel_pay_amount`, `total_amount`. Adding a new pay bracket means updating all four places.

Day-type flags on `shifts_history` (mutually exclusive — only one is true per document): `is_training`, `is_vacation`, `is_sick`, `is_holiday`. Sick docs additionally carry `sick_percent` (0 / 0.5 / 1.0) used by the PDF to bucket rows. Sick-day math is **client-side only** (see [utils/sickDays.js](utils/sickDays.js)): the cloud function receives the precomputed `sick_pay` sum and adds it to bruto + 7% pension, but does not know about the streak rule.

[lib/GeneratePaycheck.js](lib/GeneratePaycheck.js) builds an HTML payslip and renders to PDF via `expo-print` + `expo-sharing`. [lib/notfication.js](lib/notfication.js) (filename typo — keep it) schedules the weekly reminder via `expo-notifications`.

## i18n & RTL

`react-i18next` with `en` and `he` vocabularies in [translations/vocabulary.js](translations/vocabulary.js). Selected language persists in `AsyncStorage` under `user-language` via [hooks/lang-context.js](hooks/lang-context.js). Arabic (`ar`) is listed as RTL in [hooks/lang-context.js](hooks/lang-context.js) but the vocabulary block isn't translated yet — add `ar` to the resources before exposing it in `LanguagesChange`.

**Gotcha:** native RTL layout flipping is force-disabled (`I18nManager.forceRTL(false)` in `app/_layout.jsx`, plus `ExpoLocalization_supportsRTL: false` in `app.json`). Switching to Hebrew/Arabic changes copy only — layout direction stays LTR. Components should not assume the layout flips when `isRTL` is true.

## Theming

Light/dark themes are defined inline in [app/_layout.jsx](app/_layout.jsx) on top of MD3 and selected from `useColorScheme()`. Custom color tokens (`card`, `profileSection`, `borderOutline`, `dateText`, `divider`, `summary`, `editBtn`, `delBtn`) are added on top of the MD3 palette — read via `theme.colors.<token>` from `useTheme()` rather than hardcoding hex values, so dark mode keeps working.

## Environment variables

All keys are `EXPO_PUBLIC_*`, which means they are **shipped to the client bundle** — never put secrets here. Defined in `.env`:

- `EXPO_PUBLIC_APPWRITE_ENDPOINT`, `EXPO_PUBLIC_APPWRITE_PROJECT_ID`, `EXPO_PUBLIC_APPWRITE_PLATFORM`
- `EXPO_PUBLIC_APPWRITE_DB`
- `EXPO_PUBLIC_APPWRITE_USERS_PREFS_ID` (`users_prefs` collection)
- `EXPO_PUBLIC_APPWRITE_SHIFTS_HISTORY_ID` (`shifts_history` collection)
