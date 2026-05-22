# GuardPay Roadmap

Prioritized feature backlog and known issues. Replaces the loose notes in `ThingsToAdd.txt` / `ThingsToFix.txt`. Effort is rough (S = ≤1 day, M = 2–4 days, L = >1 week). Impact is from a working-shift-worker's perspective.

> **Production constraint:** the app is live on the App Store with real users. Every item below that touches the Appwrite schema (`shifts_history`, `users_prefs`) or the `CALCULATE_SALARY` cloud function must be implemented additively — no renames, no deletions, no destructive backfills. Plan a coordinated release (cloud function + JS bundle + tests) for anything that changes salary math.

---

## P0 — Known bugs (fix first)

| Item | Effort | Notes |
| --- | --- | --- |
| Decimal-point bug in hourly-rate input on Add Shift | S | User-reported. Reproduce with `50.5`, `50,50`, and `.5`. Likely in [components/shifts/](components/shifts/) or the keyboard config. Coerce with `Number()` and normalize comma → dot before validate. |
| Date input in account creation shows a different date than entered | S | Timezone offset bug — store ISO at midnight UTC or use `toLocaleDateString` consistently. Check [app/(auth)/register.jsx](app/%28auth%29/register.jsx). |
| Sign-out flow on `setupPrefs` doesn't redirect to landing | S | `RouteGuard` in [app/_layout.jsx](app/_layout.jsx) should catch this; verify `profile` is cleared synchronously with `user`. |
| Orphaned session after "delete account" | S | After delete, also call `account.deleteSession("current")` and clear `profile` state. |

## P0 — High-value features (next sprint)

### 1. Edit an existing shift's hours (S)
Today a shift is delete-and-recreate. Add an "Edit" affordance on [components/shifts/ShiftCard.jsx](components/shifts/ShiftCard.jsx) that opens the same modal as `add-shift` pre-filled. Recompute salary on save via [lib/salaryLogic.js](lib/salaryLogic.js).
- New screen: reuse `add-shift` with a route param `?shiftId=...`.
- Update the Appwrite doc instead of creating new.
- Realtime subscription will refresh overview automatically.

### 2. Per-user configurable shift presets (M)
Today `shiftTypeTimes` in [lib/utils.js](lib/utils.js) is hard-coded (morning 07–15, evening 15–23, night 23–07). Let the user override via `setupPrefs` or profile.
- Add `shift_presets` JSON column to `users_prefs`.
- On Add Shift, "Morning/Evening/Night" presets pull from the user's config.
- Fall back to current defaults if not set.

### 3. Daily-shift scheduler / recurring shifts (M)
Add a "Schedule recurring shift" flow: pick days of week + start/end time + date range → generates shifts in `shifts_history` (skip already-recorded dates).
- New screen under `app/`.
- Batch-create via Appwrite (single function call to avoid N round-trips).
- Confirm with user before creating; show preview list.

### 4. Sick days (Israeli law) (M)
From `ThingsToAdd.txt`:
- Day 1: 0% pay
- Days 2–3: 50% of daily pay
- Day 4+: 100% of daily pay

Add a SegmentedButton option "Sick" alongside Training/Vacation. User enters start + end date, calculator does the rest. Add a new **optional** `is_sick` boolean on `shifts_history` (defaults to false for historical documents — never remove or rename existing flags). Update [utils/salaryLogic.js](utils/salaryLogic.js) and the cloud function in lockstep (use the `salary-logic-guardian` subagent). Ship cloud function and JS together — don't deploy the cloud change ahead of the app update.

---

## P1 — Quality & polish

### 5. Migrate codebase to TypeScript (L)
Already on the wishlist. Start with `lib/`, `utils/`, `hooks/` (pure logic, biggest payoff), then components incrementally. Salary logic in particular has many magic field names — TS would lock the contract.

### 6. Offline-first for adding shifts (M)
Today adding a shift fails without network. Queue creates in `AsyncStorage`, flush when realtime reconnects.

### 7. Yearly summary / multi-month overview (M)
Today overview is single-month only. Add a year view: bar chart of neto per month + total tax paid for the year (useful for annual tax reconciliation in Israel).

### 8. Holiday calendar pre-population (S)
Hebrew calendar API (e.g. Hebcal) → auto-flag holiday dates in the date picker. User still confirms.

### 9. Bonus tracking (from README roadmap) (S)
One-off bonuses (per-shift or per-month) that flow into bruto but aren't tied to hours. New `bonus_amount` field on shifts + a separate "monthly bonus" entry.

### 10. PDF improvements (S)
- Add user's settlement info to the paycheck header.
- Include a "previous month" comparison row.
- Hebrew RTL rendering inside the HTML template (currently mixed).

---

## P2 — Nice-to-haves

| Item | Effort | Notes |
| --- | --- | --- |
| Apple Watch companion (clock in/out) | L | Big — needs native module work; revisit after TS migration. |
| Export shifts as CSV (for employers) | S | Use existing `expo-sharing`; reuse data from [hooks/useMonthlySalary.js](hooks/useMonthlySalary.js). |
| Widget showing this-month's neto-so-far | M | iOS WidgetKit / Android AppWidget — requires ejecting from managed-only flow. Worth it for daily-glance value. |
| Multi-employer support | L | Today profile assumes one job. Add an `employer` foreign key on shifts + employer picker. Big refactor — only if requested by real users. |
| Push notification: "your monthly paycheck is ready" on the 1st | S | Extend [lib/notfication.js](lib/notfication.js) with a monthly-recurring schedule. |
| Biometric app-lock | S | `expo-local-authentication` — useful given the financial nature. |
| In-app feedback / "report a bug" | S | Mailto link or a Tally / Formspree integration. |
| Dark-mode override (force light/dark independent of system) | S | New profile field, read in `app/_layout.jsx` to override `useColorScheme`. |

---

## Recently shipped (per README + git log)

- [x] Holiday-hours support and edit-preferences redesign (commit `e9503d1`)
- [x] Shift details on click + decimal fixes in rate input (commit `40bf40f` — verify the bug is fully gone)
- [x] PDF export
- [x] Push notifications (weekly reminder)
- [x] Multi-language (en / he / ar)
- [x] Improved month summary design
- [x] Google + Apple Sign-In (replaced email/password)

---

## How to use this file

- When picking a task, copy the row into a PR description.
- When a P0 ships, move it to "Recently shipped" with the commit SHA.
- New ideas: drop into P2 first, promote with justification.
