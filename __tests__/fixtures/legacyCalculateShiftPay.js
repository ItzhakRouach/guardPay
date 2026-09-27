/* eslint-disable */
// GOLDEN REFERENCE — verbatim copy of calculateShiftPay from commit 194ebb2
// (the last version before the optional `rules` argument). Used only by the
// byte-identity gate in __tests__/weeklyOt.test.js. Never edit; if the
// production function must change behaviour for the default path, that is a
// deliberate decision that replaces this file with a new snapshot.
const calculateShiftPay = (
  startTime,
  endTime,
  baseRate,
  travelRate,
  isHoliday,
) => {
  const start = new Date(startTime);
  let end = new Date(endTime);
  if (end < start) end.setDate(end.getDate() + 1);
  const base = Number(baseRate);

  // Night shift = ≥2h in the 22:00–06:00 window → regular cap drops 8→7.
  const checkNightShift = () => {
    let nightHours = 0;
    let current = new Date(start);
    while (current < end) {
      if (current.getHours() >= 22 || current.getHours() < 6)
        nightHours += 0.25;
      current.setMinutes(current.getMinutes() + 15);
    }
    return nightHours >= 2;
  };
  const regLimit = checkNightShift() ? 7 : 8;

  const calculateHours = (segStart, segEnd, forceWeekday = false) => {
    let rPay = 0,
      ePay = 0,
      rHours = 0,
      eHours = 0;
    let h100 = 0,
      h125e = 0,
      h150e = 0,
      h150s = 0,
      h175s = 0,
      h200s = 0;

    const duration = (segEnd - segStart) / 3600000;
    const globalOffset = (segStart - start) / 3600000;

    for (let i = 0; i < duration; i += 0.25) {
      const currentH = globalOffset + i;
      const blockTime = new Date(segStart.getTime() + i * 3600000);

      const isWeekendOrHoliday =
        !forceWeekday &&
        (isHoliday ||
          (blockTime.getDay() === 5 && blockTime.getHours() >= 16) ||
          blockTime.getDay() === 6 ||
          (blockTime.getDay() === 0 && blockTime.getHours() < 4));

      if (currentH < regLimit) {
        if (isWeekendOrHoliday) {
          h150s += 0.25;
          rPay += 0.25 * base * 1.5;
        } else {
          h100 += 0.25;
          rPay += 0.25 * base;
        }
        rHours += 0.25;
      } else if (currentH < regLimit + 2) {
        if (isWeekendOrHoliday) {
          h175s += 0.25;
          ePay += 0.25 * base * 1.75;
        } else {
          h125e += 0.25;
          ePay += 0.25 * base * 1.25;
        }
        eHours += 0.25;
      } else {
        if (isWeekendOrHoliday) {
          h200s += 0.25;
          ePay += 0.25 * base * 2;
        } else {
          h150e += 0.25;
          ePay += 0.25 * base * 1.5;
        }
        eHours += 0.25;
      }
    }
    return {
      rPay,
      ePay,
      rHours,
      eHours,
      h100,
      h125e,
      h150e,
      h150s,
      h175s,
      h200s,
    };
  };

  const sundayCutoff = new Date(start);
  sundayCutoff.setDate(sundayCutoff.getDate() - sundayCutoff.getDay() + 7);
  sundayCutoff.setHours(4, 0, 0, 0);

  let res;
  if (start < sundayCutoff && end > sundayCutoff) {
    const p1 = calculateHours(start, sundayCutoff);
    const p2 = calculateHours(sundayCutoff, end, true);
    res = {
      p: p1.rPay + p1.ePay + p2.rPay + p2.ePay,
      rh: p1.rHours + p2.rHours,
      eh: p1.eHours + p2.eHours,
      rp: p1.rPay + p2.rPay,
      ep: p1.ePay + p2.ePay,
      h100: p1.h100 + p2.h100,
      h125e: p1.h125e + p2.h125e,
      h150e: p1.h150e + p2.h150e,
      h150s: p1.h150s + p2.h150s,
      h175s: p1.h175s + p2.h175s,
      h200s: p1.h200s + p2.h200s,
    };
  } else {
    const r = calculateHours(start, end);
    res = {
      p: r.rPay + r.ePay,
      rh: r.rHours,
      eh: r.eHours,
      rp: r.rPay,
      ep: r.ePay,
      h100: r.h100,
      h125e: r.h125e,
      h150e: r.h150e,
      h150s: r.h150s,
      h175s: r.h175s,
      h200s: r.h200s,
    };
  }

  const travel = Number(travelRate || 0);

  return {
    total_amount: Number((res.p + travel).toFixed(2)),
    reg_hours: Number(res.rh.toFixed(2)),
    extra_hours: Number(res.eh.toFixed(2)),
    reg_pay_amount: Number(res.rp.toFixed(2)),
    extra_pay_amount: Number(res.ep.toFixed(2)),
    travel_pay_amount: Number(travel.toFixed(2)),
    h100_hours: Number(res.h100.toFixed(2)),
    h125_extra_hours: Number(res.h125e.toFixed(2)),
    h150_extra_hours: Number(res.h150e.toFixed(2)),
    h175_extra_hours: isHoliday ? 0 : Number(res.h175s.toFixed(2)),
    h200_extra_hours: isHoliday ? 0 : Number(res.h200s.toFixed(2)),
    h150_shabat: isHoliday ? 0 : Number(res.h150s.toFixed(2)),
    h150_holiday: isHoliday ? Number(res.h150s.toFixed(2)) : 0,
    h175_holiday: isHoliday ? Number(res.h175s.toFixed(2)) : 0,
    h200_holiday: isHoliday ? Number(res.h200s.toFixed(2)) : 0,
  };
};

module.exports = { legacyCalculateShiftPay: calculateShiftPay };
