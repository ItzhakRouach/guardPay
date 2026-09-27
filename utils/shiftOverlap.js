// Duplicate / overlap detection for Add Shift. Pure functions over
// shifts_history documents; the screen fetches the candidates with
// sameDayWindow() and asks findShiftConflicts() before creating a document.
//
// CommonJS so Jest can require it; app code imports lib/shiftOverlap.js.

function normalizedRange(startIso, endIso) {
  const s = new Date(startIso);
  const e = new Date(endIso);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null;
  // Legacy overnight docs were stored with end < start on the same date.
  if (e < s) e.setDate(e.getDate() + 1);
  return { s, e };
}

/**
 * @returns {{ exact: object|null, overlapping: object[] }}
 *   `exact`  — a worked shift with the identical start and end (a re-tap).
 *   `overlapping` — worked shifts whose time range intersects the new one.
 * Sick / vacation / training days are calendar entries, not time ranges, and
 * never count as conflicts. `excludeId` skips the document being edited.
 */
function findShiftConflicts(newStart, newEnd, docs, { excludeId } = {}) {
  const result = { exact: null, overlapping: [] };
  const n = normalizedRange(newStart, newEnd);
  if (!n) return result;
  for (const d of docs || []) {
    if (!d || (excludeId && d.$id === excludeId)) continue;
    if (d.is_sick || d.is_vacation || d.is_training) continue;
    const r = normalizedRange(d.start_time, d.end_time);
    if (!r) continue;
    if (r.s.getTime() === n.s.getTime() && r.e.getTime() === n.e.getTime()) {
      result.exact = d;
      continue;
    }
    if (r.s < n.e && n.s < r.e) result.overlapping.push(d);
  }
  return result;
}

/** ISO window from the previous day's noon to the next day's noon, so an
 *  overnight shift starting the evening before is fetched too. */
function sameDayWindow(date) {
  const d = new Date(date);
  const from = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate() - 1,
    12,
    0,
    0,
  );
  const to = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 12, 0, 0);
  return { from: from.toISOString(), to: to.toISOString() };
}

module.exports = { findShiftConflicts, sameDayWindow };
