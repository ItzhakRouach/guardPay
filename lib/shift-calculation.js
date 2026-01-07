export const calculateShiftPay = (startTime, endTime, baseRate, travelRate) => {
  const start = new Date(startTime);
  let end = new Date(endTime);
  if (end < start) end.setDate(end.getDate() + 1);

  const base = Number(baseRate);

  // 1. Night Shift Logic
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

  const regLimit = isNightShift() ? 7 : 8;

  // 2. Sunday 04:00 AM Cutoff
  const getSundayCutoff = (d) => {
    const cutoff = new Date(d);
    const day = cutoff.getDay();
    const diff = cutoff.getDate() - day + (day === 0 ? 0 : 7);
    cutoff.setDate(diff);
    cutoff.setHours(4, 0, 0, 0);
    return cutoff;
  };
  const sundayCutoff = getSundayCutoff(start);

  // 3. Calculation Engine
  const calculateHours = (segStart, segEnd, forceWeekday = false) => {
    let rPay = 0, ePay = 0, rHours = 0, eHours = 0;
    const duration = (segEnd - segStart) / (1000 * 60 * 60);
    const globalStartHour = (segStart - start) / (1000 * 60 * 60);

    for (let i = 0; i < duration; i += 0.25) {
      const currentHour = globalStartHour + i;
      const step = 0.25;
      const blockTime = new Date(segStart.getTime() + i * 60 * 60 * 1000);
      
      const isWeekendBlock = !forceWeekday &&
        ((blockTime.getDay() === 5 && blockTime.getHours() >= 16) ||
          blockTime.getDay() === 6 ||
          (blockTime.getDay() === 0 && blockTime.getHours() < 4));

      if (currentHour < regLimit) {
        // Regular Hours
        const rate = isWeekendBlock ? base * 1.5 : base;
        rPay += step * rate;
        rHours += step;
      } else if (currentHour < regLimit + 2) {
        // First 2 Extra Hours
        const rate = isWeekendBlock ? base * 1.75 : base * 1.25;
        ePay += step * rate;
        eHours += step;
      } else {
        // Remaining Extra Hours
        const rate = isWeekendBlock ? base * 2.0 : base * 1.5;
        ePay += step * rate;
        eHours += step;
      }
    }
    return { rPay, ePay, rHours, eHours };
  };

  let results;
  if (start < sundayCutoff && end > sundayCutoff) {
    const part1 = calculateHours(start, sundayCutoff);
    const part2 = calculateHours(sundayCutoff, end, true);
    results = {
      p: part1.rPay + part1.ePay + part2.rPay + part2.ePay,
      rh: part1.rHours + part2.rHours,
      eh: part1.eHours + part2.eHours,
      rp: part1.rPay + part2.rPay, // Total money from regular hours
      ep: part1.ePay + part2.ePay  // Total money from extra hours
    };
  } else {
    const res = calculateHours(start, end);
    results = {
      p: res.rPay + res.ePay,
      rh: res.rHours,
      eh: res.eHours,
      rp: res.rPay,
      ep: res.ePay
    };
  }

  const travel = Number(travelRate || 0);

  return {
    total_amount: (results.p + travel).toFixed(2),
    reg_hours: results.rh.toFixed(2),
    extra_hours: results.eh.toFixed(2),
    reg_pay_amount: results.rp.toFixed(2),   // <--- Added this
    extra_pay_amount: results.ep.toFixed(2), // <--- Added this
    travel_pay_amount: travel.toFixed(2),    // <--- Added this
  };
};