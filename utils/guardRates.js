// Minimum hourly rates under צו ההרחבה בענף השמירה והאבטחה, kept with their
// validity window so the app never presents a stale number as current.
// Source (Apr 2026): general minimum ₪6,443.85/mo (₪35.40/h); guard
// supplement ₪675 → ₪7,118.85/mo ÷ 182 h = ₪39.11; supervisor ₪683 → ₪39.16.
// Add a new row when the order is updated; keep old rows for history.
const GUARD_RATES = [
  {
    from: "2026-04-01",
    to: "2026-12-31",
    regular: 39.11,
    supervisor: 39.16,
    minWage: 35.4,
  },
];

const pad2 = (n) => String(n).padStart(2, "0");

const currentGuardRates = (date = new Date()) => {
  const d = date instanceof Date ? date : new Date(date);
  const day = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const hit = GUARD_RATES.find((r) => day >= r.from && day <= r.to);
  if (hit) return { ...hit, expired: false };
  return { ...GUARD_RATES[GUARD_RATES.length - 1], expired: true };
};

module.exports = { GUARD_RATES, currentGuardRates };
