/**
 * Israeli sick-leave pay rules (חוק דמי מחלה).
 * Each day in a contiguous sick streak is paid:
 *   Day 1     → 0%
 *   Days 2-3  → 50%
 *   Day 4+    → 100%
 * of the regular daily wage (here: price_per_hour × 8).
 *
 * Streak = consecutive calendar days with `is_sick: true` for the same user.
 */

const sickDayPercent = (dayInStreak) => {
  if (dayInStreak <= 1) return 0;
  if (dayInStreak <= 3) return 0.5;
  return 1.0;
};

const startOfDay = (d) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const daysBetween = (a, b) =>
  Math.round((startOfDay(b) - startOfDay(a)) / ONE_DAY_MS);

/**
 * Build one `shifts_history` document per day in the user-entered period.
 * The first day of the period is treated as day 1 of the streak.
 *
 * Each doc has the hour-bucket fields zeroed so it doesn't pollute totals,
 * and carries `is_sick: true` + `sick_percent` for downstream rendering.
 *
 * Caller (add-shift.jsx) is responsible for calling Appwrite's
 * createDocument for each entry, and for passing baseRate / userId.
 */
const buildSickDocs = ({ startDate, endDate, dailyPay, userId, baseRate }) => {
  const start = startOfDay(new Date(startDate));
  const end = startOfDay(new Date(endDate));
  if (end < start) return [];

  const numDays = daysBetween(start, end) + 1;
  const docs = [];

  for (let i = 0; i < numDays; i++) {
    const date = new Date(start.getTime() + i * ONE_DAY_MS);
    const percent = sickDayPercent(i + 1);
    const dayStart = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0,
      0,
      0,
    );
    const dayEnd = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      23,
      59,
      0,
    );

    docs.push({
      is_sick: true,
      sick_percent: percent,
      is_training: false,
      is_vacation: false,
      is_holiday: false,
      user_id: userId,
      base_rate: Number(baseRate) || 0,
      start_time: dayStart.toISOString(),
      end_time: dayEnd.toISOString(),
      total_amount: Number((dailyPay * percent).toFixed(2)),
      reg_hours: 0,
      extra_hours: 0,
      reg_pay_amount: 0,
      extra_pay_amount: 0,
      travel_pay_amount: 0,
      h100_hours: 0,
      h125_extra_hours: 0,
      h150_extra_hours: 0,
      h175_extra_hours: 0,
      h200_extra_hours: 0,
      h150_shabat: 0,
      h150_holiday: 0,
      h175_holiday: 0,
      h200_holiday: 0,
    });
  }

  return docs;
};

/**
 * Re-assign streak positions across an array of sick documents and return
 * the updated docs (with refreshed `sick_percent` + `total_amount`).
 *
 * Input may be unsorted. Docs are grouped into runs of consecutive calendar
 * days; within each run, position 1 = first day of the run.
 *
 * `dailyPay` is a fallback used only for docs missing their own `base_rate`.
 * Each doc's amount is normally recomputed as `doc.base_rate * 8 * percent`
 * so the historical pay rate at the time of sickness is preserved (and so
 * the result doesn't depend on the user's currently-loaded profile state).
 *
 * Caller is responsible for diffing the result against the inputs and
 * issuing updateDocument calls only for docs whose percent or amount changed.
 */
const restreakSickDocs = (docs, dailyPay = 0) => {
  if (!Array.isArray(docs) || docs.length === 0) return [];

  const sorted = [...docs].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
  );

  let position = 0;
  let prev = null;

  return sorted.map((doc) => {
    const date = new Date(doc.start_time);
    if (prev && daysBetween(prev, date) === 1) {
      position += 1;
    } else {
      position = 1;
    }
    prev = date;

    const percent = sickDayPercent(position);
    const docDailyPay = Number(doc.base_rate) > 0
      ? Number(doc.base_rate) * 8
      : Number(dailyPay) || 0;
    return {
      ...doc,
      sick_percent: percent,
      total_amount: Number((docDailyPay * percent).toFixed(2)),
    };
  });
};

/**
 * Given the user's *remaining* sick documents after an edit/delete,
 * return only the docs whose sick_percent or total_amount need updating.
 *
 * Each result item is shaped { $id, sick_percent, total_amount } — ready
 * to feed into Appwrite's updateDocument. Unchanged docs are omitted so
 * the caller only issues the minimum number of writes.
 */
const restreakSickUpdates = (docs, dailyPay) => {
  if (!Array.isArray(docs) || docs.length === 0) return [];
  const restreaked = restreakSickDocs(docs, dailyPay);
  const updates = [];
  for (const next of restreaked) {
    const prev = docs.find((d) => d.$id === next.$id);
    if (!prev) continue;
    if (
      prev.sick_percent !== next.sick_percent ||
      prev.total_amount !== next.total_amount
    ) {
      updates.push({
        $id: next.$id,
        sick_percent: next.sick_percent,
        total_amount: next.total_amount,
      });
    }
  }
  return updates;
};

module.exports = {
  sickDayPercent,
  buildSickDocs,
  restreakSickDocs,
  restreakSickUpdates,
};
