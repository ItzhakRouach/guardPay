// Week context for the weekly overtime rule. Pure; CommonJS so Jest can
// require it. Appwrite-aware wrappers live in lib/weeklyOt.js.
//
// Week = local Sunday 00:00 → next Sunday 00:00 (exclusive). A shift belongs
// to the week it STARTS in. Only worked documents (not training / vacation /
// sick) contribute regular hours.

const { calculateShiftPay } = require("./salaryLogic");
const { parseOvertimeRules, toCalcRules } = require("./overtimeRules");

const RECOMPUTE_FIELDS = [
  "total_amount",
  "reg_hours",
  "extra_hours",
  "reg_pay_amount",
  "extra_pay_amount",
  "travel_pay_amount",
  "h100_hours",
  "h125_extra_hours",
  "h150_extra_hours",
  "h175_extra_hours",
  "h200_extra_hours",
  "h150_shabat",
  "h150_holiday",
  "h175_holiday",
  "h200_holiday",
];

const toDate = (v) => (v instanceof Date ? v : new Date(v));

const weekStartOf = (dateLike) => {
  const d = toDate(dateLike);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
};
const weekEndOf = (dateLike) => {
  const s = weekStartOf(dateLike);
  return new Date(s.getFullYear(), s.getMonth(), s.getDate() + 7);
};
const weekKeyOf = (dateLike) => {
  const s = weekStartOf(dateLike);
  return `${s.getFullYear()}-${s.getMonth()}-${s.getDate()}`;
};

const isWorkedDoc = (d) =>
  !!d && !d.is_training && !d.is_vacation && !d.is_sick;

const byStart = (a, b) =>
  new Date(a.start_time).getTime() - new Date(b.start_time).getTime() ||
  String(a.$id).localeCompare(String(b.$id));

const regularHoursBefore = (weekDocs, shiftStartIso, excludeId) => {
  const t = new Date(shiftStartIso).getTime();
  return (weekDocs || [])
    .filter(
      (d) =>
        isWorkedDoc(d) &&
        (!excludeId || d.$id !== excludeId) &&
        new Date(d.start_time).getTime() < t,
    )
    .reduce((a, d) => a + Number(d.reg_hours || 0), 0);
};

const numOr0 = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

/**
 * Recompute every worked doc of one week in start order under `rules`.
 * Returns only the docs whose stored pay fields or weekly_regular_before
 * differ — ready for updateDocument. Never touches flat-day docs.
 */
const recomputeWeek = (weekDocs, rules) => {
  const r = parseOvertimeRules(rules);
  const sorted = (weekDocs || []).filter(isWorkedDoc).sort(byStart);
  let running = 0;
  const updates = [];
  for (const d of sorted) {
    const baseRate = Number(d.base_rate);
    const parseable =
      !Number.isNaN(new Date(d.start_time).getTime()) &&
      !Number.isNaN(new Date(d.end_time).getTime());
    if (!(baseRate > 0) || !parseable) {
      // Too old or malformed to recompute safely (the calculator would
      // return zeros); still counts toward the week.
      running += numOr0(d.reg_hours);
      continue;
    }
    const before = r.weekly ? Math.round(running * 100) / 100 : null;
    const fresh = calculateShiftPay(
      d.start_time,
      d.end_time,
      baseRate,
      numOr0(d.travel_pay_amount),
      !!d.is_holiday,
      toCalcRules(r, before),
    );
    running += numOr0(fresh.reg_hours);

    const storedBefore =
      d.weekly_regular_before === undefined ? null : d.weekly_regular_before;
    const changed =
      RECOMPUTE_FIELDS.some((f) => numOr0(d[f]) !== numOr0(fresh[f])) ||
      storedBefore !== before;
    if (!changed) continue;

    const update = { $id: d.$id, weekly_regular_before: before };
    for (const f of RECOMPUTE_FIELDS) update[f] = fresh[f];
    updates.push(update);
  }
  return updates;
};

module.exports = {
  RECOMPUTE_FIELDS,
  weekStartOf,
  weekEndOf,
  weekKeyOf,
  isWorkedDoc,
  regularHoursBefore,
  recomputeWeek,
};
