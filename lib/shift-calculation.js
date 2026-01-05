export const calculateShiftPay = (startTime, endTime, baseRate, travelRate) => {
  const start = new Date(startTime);
  let end = new Date(endTime);
  if (end < start) end.setDate(end.getDate() + 1);

  const base = Number(baseRate);

  // 1. Check if it's a Night Shift (at least 2 hours between 22:00 and 06:00)
  const isNightShift = () => {
    let nightHours = 0;
    let current = new Date(start);
    while (current < end) {
      const hour = current.getHours();
      if (hour >= 22 || hour < 6) nightHours += 0.25;
      current.setMinutes(current.getMinutes() + 15);
    }
    return nightHours >= 2;
  };

  // Determine regular hour limit (7 for night shift, 8 for day shift)
  const regLimit = isNightShift() ? 7 : 8;

  // 2. Sunday 04:00 AM Cutoff Logic
  const getSundayCutoff = (d) => {
    const cutoff = new Date(d);
    const day = cutoff.getDay();
    const diff = cutoff.getDate() - day + (day === 0 ? 0 : 7);
    cutoff.setDate(diff);
    cutoff.setHours(4, 0, 0, 0);
    return cutoff;
  };
  const sundayCutoff = getSundayCutoff(start);

  let totalPay = 0;
  let totalReg = 0;
  let totalExtra = 0;

  // 3. Calculation Engine (Iterative)
  const calculateHours = (segStart, segEnd, forceWeekday = false) => {
    let p = 0,
      r = 0,
      e = 0;
    const duration = (segEnd - segStart) / (1000 * 60 * 60);

    // We track the "global hour index" to know when we hit overtime limits
    const globalStartHour = (segStart - start) / (1000 * 60 * 60);

    for (let i = 0; i < duration; i += 0.25) {
      const currentHour = globalStartHour + i;
      const step = 0.25;

      // Determine if THIS specific 15-minute block is weekend or weekday
      const blockTime = new Date(segStart.getTime() + i * 60 * 60 * 1000);
      const isWeekendBlock =
        !forceWeekday &&
        ((blockTime.getDay() === 5 && blockTime.getHours() >= 16) ||
          blockTime.getDay() === 6 ||
          (blockTime.getDay() === 0 && blockTime.getHours() < 4));

      if (currentHour < regLimit) {
        // Regular Hours (7h for night, 8h for day)
        p += step * (isWeekendBlock ? base * 1.5 : base);
        r += step;
      } else if (currentHour < regLimit + 2) {
        // First 2 Extra Hours (125% or 175%)
        p += step * (isWeekendBlock ? base * 1.75 : base * 1.25);
        e += step;
      } else {
        // Remaining Extra Hours (150% or 200%)
        p += step * (isWeekendBlock ? base * 2.0 : base * 1.5);
        e += step;
      }
    }
    return { p, r, e };
  };

  // Logic: Split if crossing Sunday 04:00, otherwise calculate whole
  if (start < sundayCutoff && end > sundayCutoff) {
    const part1 = calculateHours(start, sundayCutoff); // Checks weekend internally
    const part2 = calculateHours(sundayCutoff, end, true); // Force weekday after cutoff
    totalPay = part1.p + part2.p;
    totalReg = part1.r + part2.r;
    totalExtra = part1.e + part2.e;
  } else {
    const res = calculateHours(start, end);
    totalPay = res.p;
    totalReg = res.r;
    totalExtra = res.e;
  }

  totalPay += Number(travelRate || 0);

  return {
    total_amount: totalPay.toFixed(2),
    reg_hours: totalReg.toFixed(2),
    extra_hours: totalExtra.toFixed(2),
  };
};
