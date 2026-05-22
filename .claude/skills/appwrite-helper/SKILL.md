---
name: appwrite-helper
description: Reference and helper for GuardPay's Appwrite backend. Use when adding a new collection, function, OAuth provider, or query, or when troubleshooting auth/realtime/permissions. Documents the live function IDs and collection schemas so you don't have to dig.
---

# appwrite-helper

GuardPay's Appwrite project: `69583540003a5151db86` on `https://fra.cloud.appwrite.io/v1`. Client lives in [lib/appwrite.js](lib/appwrite.js).

## Live resources

### Database
- **DB ID:** `695835c0002144f7a605` (env: `EXPO_PUBLIC_APPWRITE_DB`)

### Collections
| Name | Env var | Purpose | Key fields |
| --- | --- | --- | --- |
| `users_prefs` | `EXPO_PUBLIC_APPWRITE_USERS_PREFS_ID` | One profile doc per user | `user_id`, `price_per_hour`, `price_per_ride`, settlement info, language pref, name, birthdate |
| `shifts_history` | `EXPO_PUBLIC_APPWRITE_SHIFTS_HISTORY_ID` | One doc per shift | `user_id`, `start_time`, `end_time`, `base_rate`, `is_training`, `is_vacation`, `is_holiday`, plus the full hour-bucket bundle (see below) |

**Hour-bucket fields on `shifts_history`** (must match [lib/salaryLogic.js](lib/salaryLogic.js) output):
`h100_hours`, `h125_extra_hours`, `h150_extra_hours`, `h150_shabat`, `h175_extra_hours`, `h200_extra_hours`, `reg_hours`, `extra_hours`, `reg_pay_amount`, `extra_pay_amount`, `travel_pay_amount`, `total_amount`.

### Functions
| ID | Purpose | Caller |
| --- | --- | --- |
| `697d0f3c001bba7f03d2` | `CALCULATE_SALARY` — accepts `{ action, payload }` → returns `{ bruto, neto, pensia, bituahLeumiAndHealth, incomeTax, totalDeductions }`. Mirrors [utils/salaryLogic.js](utils/salaryLogic.js) `calculateSalary()`. | [hooks/useMonthlySalary.js](hooks/useMonthlySalary.js) |
| `697d1855002cf9854228` | Apple Sign-In token exchange. Accepts `{ code, email, fullName }`, returns `{ userId, secret }`. | [hooks/auth-context.js](hooks/auth-context.js) |

### OAuth
- **Google**: `account.createOAuth2Token("google", redirect, redirect)` with redirect `appwrite-callback-69583540003a5151db86://google`. Scheme matches `scheme` in [app.json](app.json).
- **Apple**: native `AppleAuthentication.signInAsync` → custom function → `account.createSession`.

### Realtime
- Channel pattern: `databases.<DB>.collections.<COLLECTION>.documents`
- Active subscription in [hooks/useShift.js](hooks/useShift.js) — filters by `user_id` in the payload and on `.delete` events.

## When invoked

### "Add a new collection"
1. Confirm the schema with the user (fields + types + required + indexes).
2. Add the new env var to `.env` following the `EXPO_PUBLIC_APPWRITE_<NAME>_ID` pattern.
3. Export the constant from [lib/appwrite.js](lib/appwrite.js).
4. Remind the user to create the collection in the Appwrite console (this skill can't do it for them) with: per-document `user_id` attribute, an index on `user_id`, and document-level permissions scoped to the owning user.
5. Update [CLAUDE.md](CLAUDE.md) to list the new collection.

### "Add a new function"
1. Don't hardcode the function ID inline. Read the existing pattern in [hooks/useMonthlySalary.js](hooks/useMonthlySalary.js) — IDs currently live at the call site, but consider exporting a `FUNCTION_IDS` map from `lib/appwrite.js`.
2. Define the request/response shape in a comment near the caller.
3. If the function does salary math, use the `salary-logic-guardian` subagent to verify the JS mirror in `utils/salaryLogic.js` stays in sync.

### "Add an OAuth provider"
1. Provider must be enabled in the Appwrite console first.
2. The redirect scheme is fixed by Appwrite: `appwrite-callback-<projectId>://<provider>`. The matching `scheme` in [app.json](app.json) is `appwrite-callback-69583540003a5151db86`.
3. Mirror the Google pattern in [hooks/auth-context.js](hooks/auth-context.js): `createOAuth2Token` → `openAuthSessionAsync` → extract `userId`/`secret` → `account.createSession`.

### "Add a query / filter"
- Always scope by user: `Query.equal("user_id", currentUser.$id)`.
- Date ranges: `Query.between("start_time", startISO, endISO)`.
- Default limit is 25; `Query.limit(60)` is used for monthly shifts (already high enough).
- For pagination beyond 60, switch to cursor-based (`Query.cursorAfter`).

### "Permissions troubleshooting"
- Documents must be created with `Permission.read(Role.user(userId))` + `Permission.update(Role.user(userId))` + `Permission.delete(Role.user(userId))`.
- If the user can read other users' data → check collection-level permissions; should be empty (use document-level only).

## Safety rules

**The Appwrite project is production with live users.** Read these before touching any schema or function.

- **Never delete or rename** an existing field on `users_prefs` or `shifts_history`. Old documents will become unreadable or silently lose data. Add new fields as optional with a default.
- **Never rename or remove** an entry in the hour-bucket field-name contract (`h100_hours`, `h125_extra_hours`, `h150_extra_hours`, `h150_shabat`, `h175_extra_hours`, `h200_extra_hours`, `reg_pay_amount`, `extra_pay_amount`, `travel_pay_amount`, `total_amount`). Historical shifts depend on these.
- **Cloud function deploys are immediate-production.** `CALCULATE_SALARY` (`697d0f3c001bba7f03d2`) affects every user's neto the moment it ships. Always: (1) mirror the change in [utils/salaryLogic.js](utils/salaryLogic.js), (2) run `npm test`, (3) ask the user before deploying.
- **No experimental queries against live data.** If you need to test a destructive or bulk operation, ask the user to create a staging Appwrite project and copy the env vars.
- **Migrations / backfills** require an approved dry-run plan that estimates affected document count and is reversible.
- **OTA risk:** because `runtimeVersion.policy: "appVersion"` is set in [app.json](app.json), an `eas update` lands on every installed device on the next launch — including JS that calls a renamed Appwrite field. Coordinate schema changes with the app release, not after.
- Never put a non-`EXPO_PUBLIC_` secret in `.env` — it'll still ship to the client bundle.
- Function IDs are environment-coupled. Don't swap them when copying code between environments without confirming the IDs in the target project.
- Realtime subscriptions must be cleaned up — `return () => unsubscribe()` in every `useEffect`.
