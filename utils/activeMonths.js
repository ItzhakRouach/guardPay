// Profile-header lifetime stats without rescanning the whole history on
// every visit. `statsFromDocs` builds the cache once; `applyStatsEvent`
// keeps it current from realtime events. A delete may have emptied a month,
// which can't be known without a rescan — so it flags `dirty` and the hook
// rescans lazily. CommonJS so Jest can require it directly.

const { monthKeyOf } = require("./shiftsCache");

function statsFromDocs(docs) {
  const months = new Set();
  let total = 0;
  for (const s of docs || []) {
    total += 1;
    const k = monthKeyOf(s && s.start_time);
    if (k) months.add(k);
  }
  return { total, months: [...months] };
}

function applyStatsEvent(stats, kind, monthKey) {
  const base = stats || { total: 0, months: [] };
  if (kind === "create") {
    const months =
      monthKey && !base.months.includes(monthKey)
        ? [...base.months, monthKey]
        : [...base.months];
    return { ...base, total: base.total + 1, months };
  }
  if (kind === "delete") {
    return {
      ...base,
      total: Math.max(0, base.total - 1),
      months: [...base.months],
      dirty: true,
    };
  }
  if (kind === "update" && monthKey && !base.months.includes(monthKey)) {
    // Edited into a month we hadn't seen (a date change): add it, and flag
    // dirty because the source month may have emptied.
    return { ...base, months: [...base.months, monthKey], dirty: true };
  }
  return base;
}

module.exports = { statsFromDocs, applyStatsEvent };
