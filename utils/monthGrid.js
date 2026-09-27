// The shape of a calendar month, and a month's shifts bucketed by day.
//
// This is the one place that knows how a month is laid out. The same
// arithmetic used to live twice — `weekOfMonth` in the Shifts tab and
// `bucketByWeek` in Overview — and the calendar grid would have been a
// third copy.
//
// Weeks run Sunday to Saturday, matching the Israeli work week and the
// weekly-overtime rule in utils/weeklyOt.js. A shift belongs to the day it
// STARTS on, which is what `resolveTint`, `ShiftRow` and the month query
// already assume, so an overnight shift does not split across two cells.
//
// CommonJS so Jest can require it; app code imports lib/monthGrid.js.

const { docBruto } = require("./monthlyTotals");

const daysInMonth = (year, monthIndex) =>
  new Date(year, monthIndex + 1, 0).getDate();

/**
 * @returns {{year, monthIndex, firstWeekday, daysInMonth, weeksInMonth, cells}}
 *   `cells` is weeksInMonth × 7 long, row-major from Sunday, holding a day
 *   number or null for the leading and trailing blanks.
 */
function monthShape(year, monthIndex) {
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const total = daysInMonth(year, monthIndex);
  const weeksInMonth = Math.ceil((total + firstWeekday) / 7);
  const cells = new Array(weeksInMonth * 7).fill(null);
  for (let d = 1; d <= total; d += 1) cells[firstWeekday + d - 1] = d;
  return {
    year,
    monthIndex,
    firstWeekday,
    daysInMonth: total,
    weeksInMonth,
    cells,
  };
}

/** 1-indexed week of the month, as the Shifts list has always labelled it. */
function weekOfMonth(dateLike) {
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
  const firstWeekday = new Date(d.getFullYear(), d.getMonth(), 1).getDay();
  return Math.ceil((d.getDate() + firstWeekday) / 7);
}

/** 0-indexed grid row for a day number, given the month's first weekday. */
function weekIndexOfDay(day, firstWeekday) {
  return Math.floor((firstWeekday + day - 1) / 7);
}

/**
 * Group a month's documents by the day-of-month they start on.
 * @returns {Object<number, object[]>} each list in start order.
 */
function bucketByDay(shifts) {
  const out = {};
  for (const s of shifts || []) {
    const t = new Date(s && s.start_time);
    if (Number.isNaN(t.getTime())) continue;
    const day = t.getDate();
    (out[day] = out[day] || []).push(s);
  }
  for (const day of Object.keys(out)) {
    out[day].sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime() ||
        String(a.$id).localeCompare(String(b.$id)),
    );
  }
  return out;
}

/**
 * What one day is worth. `bruto` goes through `docBruto` so a training
 * day's travel is counted exactly as the month total counts it.
 */
function dayTotals(docs) {
  const list = docs || [];
  let hours = 0;
  let bruto = 0;
  for (const d of list) {
    hours += Number(d.reg_hours || 0) + Number(d.extra_hours || 0);
    bruto += docBruto(d);
  }
  return {
    count: list.length,
    hours: Number(hours.toFixed(2)),
    bruto: Number(bruto.toFixed(2)),
  };
}

/**
 * Sum a month's earnings into its calendar weeks (Sunday→Saturday).
 *
 * The bucket count follows `monthShape`, so the Overview chart's W1..Wn
 * bars line up with the Shifts tab's week grouping and with the calendar
 * grid's rows. The month is passed in rather than sniffed from the first
 * document, so an empty month still returns the right number of zeroed
 * bars and a stray document from a neighbouring month cannot shift the
 * whole chart.
 *
 * @param {object[]} shifts
 * @param {number} year
 * @param {number} monthIndex 0-based, as Date uses.
 * @returns {number[]} one bruto total per week, 0-indexed.
 */
function bucketByWeek(shifts, year, monthIndex) {
  const { firstWeekday, weeksInMonth } = monthShape(year, monthIndex);
  const buckets = new Array(weeksInMonth).fill(0);
  for (const s of shifts || []) {
    const d = new Date((s && s.start_time) || (s && s.date));
    if (Number.isNaN(d.getTime())) continue;
    if (d.getFullYear() !== year || d.getMonth() !== monthIndex) continue;
    const wk = weekIndexOfDay(d.getDate(), firstWeekday);
    if (wk >= 0 && wk < buckets.length) buckets[wk] += docBruto(s);
  }
  return buckets;
}

module.exports = {
  monthShape,
  weekOfMonth,
  weekIndexOfDay,
  bucketByDay,
  bucketByWeek,
  dayTotals,
};
