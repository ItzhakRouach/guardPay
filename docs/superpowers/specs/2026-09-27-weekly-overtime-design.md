# Weekly overtime, configurable daily norm, guard presets, compliance flags — design

**Date:** 2026-09-27 · **Branch:** `feat/weekly-ot` · **Status:** draft for owner review

## 1. Goal

Make GuardPay's overtime match Israeli law more closely than any competing app, without changing a single number for users who don't opt in:

1. **Weekly overtime.** Since April 2018 the standard week is **42 hours**. An hour is overtime if it exceeds the daily norm **or** if the week's regular hours are already used up. Today the app applies only the daily rule, per shift.
2. **Configurable daily norm.** 8 hours (today's default) or 8.6 hours (the legal norm for a 5-day week). Night shifts stay at 7. Weekly cap fixed at 42 by law.
3. **Overnight treatment.** Default: one continuous work day (today's behaviour). Optional: split at midnight (the case-law reading). Labelled as legally contested.
4. **Guard-sector rate presets.** One-tap hourly rate for מאבטח (₪39.11) and אחראי (₪39.16), valid 1 Apr–31 Dec 2026, in setup and preferences.
5. **Compliance flags.** A plain-language "worth knowing" card on Overview: over 12 hours in a day, over 16 overtime hours in a week, under 36 hours of weekly rest.

## 2. Decisions already made with the owner

| Topic | Decision |
|---|---|
| Rollout | Opt-in per user, **default off**. With the toggle off, every number is byte-identical to today. |
| What counts toward 42 | Only hours paid at the regular rate (`reg_hours`: 100% weekday, 150% Shabbat/חג inside the daily cap). Hours already paid as daily overtime are excluded. Training / vacation / sick days count 0. |
| Tiering of weekly-triggered OT | Per day, as the National Labour Court requires: within a shift the first 2 OT hours are 125% (175% weekend/holiday), the rest 150% (200%). Never "first 2 hours of the week". |
| Week | Sunday 00:00 → Saturday 24:00 local. A shift belongs to **the week it starts in**. |
| Overnight | Continuous by default; midnight split as an advanced toggle with an honest "legally contested" note. |
| Daily norm | 8 (default, today's behaviour) or 8.6. Night 7, fixed. Weekly 42, fixed. |
| Turning the toggle on/off or changing a rule | **Recomputes the current month** under the new rules (weeks overlapping the month). Earlier months are never touched. |
| Warnings | Overview card only; nothing on rows. |

## 3. How it works today (facts that constrain the design)

- `calculateShiftPay(start, end, baseRate, travelRate, isHoliday)` in `utils/salaryLogic.js` computes one shift **in isolation**, in 15-minute blocks. Regular cap = 8 h (7 h if ≥2 h fall in 22:00–06:00), measured from the shift's own start. Bracket per block: regular → first 2 OT hours → rest.
- A `shifts_history` document stores the raw times **and** the frozen result (nine hour buckets + four money fields). All readers use the stored buckets; nothing recomputes on read.
- Month fetch is by `start_time` inside the calendar month; the store caches per month (`hooks/shifts-store.js`).
- A "recompute a set of documents and write only the changed ones" pattern already exists for sick days: `restreakSickUpdates` in `utils/sickDays.js`.
- Per-user JSON settings already follow one pattern: `users_prefs.default_shift_times` string + `parseUserShiftTimes` with safe defaults (`utils/shiftTimes.js`).
- 51 salary tests lock the current single-shift behaviour.

## 4. Design

### 4.1 Calculator: additive `rules` argument

`calculateShiftPay(startTime, endTime, baseRate, travelRate, isHoliday, rules)` where `rules` is optional:

```js
{
  dailyRegularHours: 8,        // 8 | 8.6
  nightRegularHours: 7,        // fixed
  midnightSplit: false,        // false = continuous day (today)
  weeklyCap: 42,               // fixed
  weeklyRegularBefore: null,   // null = weekly rule OFF; number = regular hours already used this week before this shift
}
```

**Backward compatibility is the gate:** with `rules` omitted (or all defaults and `weeklyRegularBefore: null`) the function must reproduce all 51 existing assertions byte-for-byte. A dedicated test asserts equality of the full output object for every existing fixture with and without an explicit default `rules`.

Per 15-minute block the logic becomes (portions, not whole blocks, so 8.6 and fractional weekly remainders are exact):

```
d = 0.25
regularRoom  = max(0, regLimit - hoursIntoDay)           // daily cap (per segment if midnightSplit)
weeklyRoom   = weeklyOn ? max(0, 42 - regularSoFar) : ∞   // regularSoFar starts at weeklyRegularBefore
r            = min(d, regularRoom, weeklyRoom)             // regular-rate portion
ot           = d - r
tier1        = min(ot, max(0, 2 - otSoFarThisDay))         // 125% / 175%
tier2        = ot - tier1                                  // 150% / 200%
regularSoFar += r ; otSoFarThisDay += ot
```

- `regLimit` = `nightRegularHours` if the whole shift is a night shift (existing ≥2 h rule), else `dailyRegularHours`. Night detection is unchanged.
- `hoursIntoDay` = hours since shift start; with `midnightSplit` it resets at the first local midnight inside the shift, and `otSoFarThisDay` resets with it.
- Weekend/holiday routing per block is unchanged (Fri ≥16:00, Sat, Sun <04:00, `isHoliday`), as is the existing Sunday-04:00 split with `forceWeekday`.
- With defaults, `r` is always 0 or 0.25 and `tier1` boundary is at `regLimit + 2`, which is exactly today's arithmetic.
- Output shape is unchanged (same 15 fields). One optional field is **added** to the document by `computeShiftDoc`: `weekly_regular_before` (number or absent), so the details screen can explain the result and a later pass can detect which rule a document was computed under.

### 4.2 Rules storage and parsing

- New optional `users_prefs.overtime_rules` **String** (size 1024). JSON, e.g. `{"weekly":true,"daily":8.6,"midnightSplit":false}`. Only non-default keys are serialised (same convention as shift times).
- `utils/overtimeRules.js` (CJS) + `lib/overtimeRules.js`: `DEFAULT_RULES`, `parseOvertimeRules(raw)` (defensive, returns a full object; unknown/invalid → defaults), `serialiseOvertimeRules(rules)`, `toCalcRules(rules, weeklyRegularBefore)`.
- Owner adds the attribute in the console before merge (additive, optional, safe for historical documents). A second optional attribute on `shifts_history`: `weekly_regular_before` (Float, optional).

### 4.3 Week context and recomputation

`utils/weeklyOt.js` (CJS, pure):

- `weekStartOf(date)` → local Sunday 00:00; `weekKeyOf(iso)`.
- `regularHoursBefore(weekDocs, shiftStartIso, excludeId)` → sum of `reg_hours` of **worked** docs (not training/vacation/sick) in the same week whose `start_time` is earlier (ties broken by `$id`).
- `recomputeWeek(weekDocs, rules)` → for each worked doc in start order, recompute via `calculateShiftPay(doc.start_time, doc.end_time, doc.base_rate, doc.travel_pay_amount, doc.is_holiday, toCalcRules(rules, runningRegular))`, advance `runningRegular` by the recomputed `reg_hours`, and return `{ $id, ...15 fields, weekly_regular_before }` **only** for documents whose stored fields differ (same minimal-diff contract as `restreakSickUpdates`). With `rules.weekly === false` the recompute passes `weeklyRegularBefore: null`, which is how disabling the toggle restores daily-only numbers.

`lib/weeklyOt.js` (ESM, Appwrite-aware):

- `fetchWeekDocs(userId, date)` → the Sunday–Saturday window of that date, via `listAllDocuments`.
- `applyWeekUpdates(updates)` → `updateDocument` per changed doc with `Promise.allSettled`; returns `{ applied, failed }`.
- `recomputeRange(userId, fromDate, toDate, rules)` → fetch from the Sunday on/before `fromDate` to the Saturday on/after `toDate`, group by start-week, run `recomputeWeek` per week, apply. Used by the settings modal (current month) and by delete.

**Write paths when the weekly rule is ON:**

| Action | Steps |
|---|---|
| Add worked shift | fetch week docs → `weekly_regular_before = regularHoursBefore(...)` → `computeShiftDoc` with rules → create → `recomputeWeek` on (week docs + new doc) → apply updates to later shifts. |
| Edit worked shift | same, excluding the edited doc's old version from "before" and including its new version in the recompute. |
| Delete worked shift | delete → `recomputeWeek` on the remaining week docs → apply. |
| Add/edit/delete training, vacation, sick, holiday | Holiday is a worked shift and follows the rows above. Training/vacation/sick contribute 0 regular hours; no week recompute needed. |
| Toggle or rule change in settings | save `overtime_rules` → `recomputeRange(current month)` with a blocking overlay and a result line ("X shifts recalculated") → profile refresh. |

When the rule is OFF, the write paths are exactly today's (no fetch, no recompute), except that a rules change from ON to OFF triggers the current-month recompute described above.

Failure handling: partial failures in `applyWeekUpdates` are reported with the existing `shifts.restreak_partial` pattern and the month is refetched; the user's own shift is never left unsaved because of a later-shift update failing.

### 4.4 Guard-sector presets

- `utils/guardRates.js`: `GUARD_RATES = [{ from: "2026-04-01", to: "2026-12-31", regular: 39.11, supervisor: 39.16, minWage: 35.40 }]`, `currentGuardRates(date = today)` → the matching row or the latest one with an `expired: true` flag.
- Setup step 2 and the Preferences modal show two chips under the hourly-rate field: "מאבטח · ₪39.11" and "אחראי · ₪39.16", filling the field. A one-line note: "תעריף המינימום לפי צו ההרחבה בענף השמירה, בתוקף עד 31.12.2026". When expired, the note says so and asks the user to check the current rate. No new schema field.

### 4.5 Compliance flags

`utils/compliance.js` (CJS, pure): `computeComplianceFlags(monthDocs, rules)` over worked docs:

- `long_day`: any shift longer than 12 h (duration from stored times, legacy end<start tolerated). Lists the dates.
- `weekly_ot`: any start-week whose summed `extra_hours` exceeds 16. Lists the week (e.g. "שבוע 3").
- `short_rest`: within any start-week, the longest gap between the end of one worked shift and the start of the next is under 36 h **and** the week has 6+ worked days. (The 36-hour rest is the legal minimum; requiring 6 worked days avoids flagging normal weeks with days off. Documented as a heuristic in the card copy.)

Overview renders a "כדאי לדעת" card **only** when at least one flag exists, with one plain sentence per flag and a short footer that these are legal limits the guard can raise with the employer, not pay changes. Weeks straddling the month edges are evaluated on the month's documents only (known approximation, noted in code).

### 4.6 Settings UI

New `components/profile/OvertimeSettingsModal.jsx`, opened from a new Preferences row "שעות נוספות" (value: "שבועי פעיל · 8.6 שעות" or "יומי בלבד"):

1. **Switch** "חישוב שעות נוספות שבועי (42 שעות)" with a 2-line explanation and a note that changing it recalculates the current month.
2. **Segmented** "שעות רגילות ביום": 8 / 8.6, with "8.6 = שבוע עבודה של 5 ימים לפי החוק".
3. **Segmented** "משמרת לילה החוצה חצות": "יום עבודה רצוף" / "פיצול בחצות", with the contested-law note.
4. Save → write → recompute current month (overlay + count) → close. Errors surface like the other modals.

### 4.7 Shift details

When a document carries `weekly_regular_before`, the rule line under the duration reads: "לפני משמרת זו נצברו X שעות רגילות השבוע; מעבר ל-42 השעות משולמות כשעות נוספות". Otherwise unchanged.

### 4.8 Caches and rollback path

- `lib/salaryCache.js` key prefix `salary_cache:v1:` → `v2:` (numbers can change for opted-in users after recompute; stale v1 entries must not be served).
- The `CALCULATE_SALARY` cloud function stops being a byte-faithful mirror for opted-in users. It remains for `DELETE_ACCOUNT` only. `CLAUDE.md` is updated to say the rollback path is retired.

## 5. Out of scope

- Editable weekly cap or night norm (fixed by law).
- 5-day / 6-day work-week picker (only affected the suggested daily norm).
- Friday 7-hour norm for 6-day weeks.
- Counting vacation/sick/training hours toward the 42.
- Recomputing months before the current one.
- Row-level compliance markers.
- Timezone handling (still device-local, as everywhere in the app).

## 6. Testing

New Jest suites, all pure:

- `weeklyOt.test.js`: default `rules` reproduces every existing salary fixture byte-for-byte; 6×7 h Sun–Fri under 42 → Friday's 43rd hour onward is OT; daily + weekly merge on the same shift (2 h at 125% then 150%); tie of daily and weekly boundary; 8.6 daily norm gives 0.6 h regular in the 9th hour; weekly remainder of 0.35 h; midnight split resets the daily cap and OT tier at 00:00; a Saturday-night shift counts in the week it starts; חג shift with weekly cap pays 175/200 after the cap; training/vacation/sick contribute 0; `recomputeWeek` returns minimal diffs, tolerates legacy end<start, ignores flat-day docs, and is stable (running twice yields no updates); `regularHoursBefore` ordering and exclusion.
- `overtimeRules.test.js`: parse defaults, invalid JSON, unknown keys, serialise only non-defaults, round-trip.
- `guardRates.test.js`: in-range date, before range, after range (expired).
- `compliance.test.js`: each flag positive and negative, month with no flags → empty.
- Existing 229 tests unchanged.

Device verification: toggle on with a month of 6 × 8 h shifts → Friday shows OT; toggle off → numbers return; add a 10 h shift early in the week → later shifts' overtime shifts earlier; delete it → they revert; 8.6 norm on a 9 h shift → 0.4 h OT; midnight split on a 20:00–06:00 shift; presets fill the rate; Overview card appears for a 13 h shift and disappears when it's deleted.

## 7. Owner actions before merge

1. Appwrite console → `users_prefs` → add attribute `overtime_rules`, String, size 1024, not required.
2. Appwrite console → `shifts_history` → add attribute `weekly_regular_before`, Float, not required, min 0, max 200.
