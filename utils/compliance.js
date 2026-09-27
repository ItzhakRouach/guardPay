// Legal-limit flags for the Overview "worth knowing" card. Informational
// only — never changes pay. Evaluated on the documents passed in (one month),
// so weeks straddling month edges are judged on the visible part only.
const { isWorkedDoc, weekKeyOf } = require("./weeklyOt");

const LIMITS = Object.freeze({
  longDayHours: 12,
  weeklyOtHours: 16,
  restHours: 36,
  restMinWorkedDays: 6, // the 36h rest is only judged on weeks with 6+ worked days
});

const range = (d) => {
  const s = new Date(d.start_time);
  const e = new Date(d.end_time);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null;
  if (e < s) e.setDate(e.getDate() + 1);
  return { s, e, hours: (e - s) / 36e5 };
};

const computeComplianceFlags = (docs) => {
  const worked = (docs || []).filter(isWorkedDoc);
  const longDays = [];
  const weeks = new Map();

  for (const d of worked) {
    const r = range(d);
    if (!r) continue;
    if (r.hours > LIMITS.longDayHours) longDays.push(d.start_time);
    const k = weekKeyOf(d.start_time);
    if (!weeks.has(k)) weeks.set(k, { ot: 0, ranges: [], days: new Set() });
    const w = weeks.get(k);
    w.ot += Number(d.extra_hours || 0);
    w.ranges.push(r);
    w.days.add(`${r.s.getFullYear()}-${r.s.getMonth()}-${r.s.getDate()}`);
  }

  const otWeeks = [];
  const shortRestWeeks = [];
  for (const [weekKey, w] of weeks) {
    if (w.ot > LIMITS.weeklyOtHours) {
      otWeeks.push({ weekKey, hours: Number(w.ot.toFixed(2)) });
    }
    if (w.days.size >= LIMITS.restMinWorkedDays) {
      const sorted = [...w.ranges].sort((a, b) => a.s - b.s);
      let longestGap = 0;
      for (let i = 1; i < sorted.length; i += 1) {
        const gap = (sorted[i].s - sorted[i - 1].e) / 36e5;
        if (gap > longestGap) longestGap = gap;
      }
      if (longestGap < LIMITS.restHours) shortRestWeeks.push(weekKey);
    }
  }
  return { longDays, otWeeks, shortRestWeeks };
};

module.exports = { LIMITS, computeComplianceFlags };
