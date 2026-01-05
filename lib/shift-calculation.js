//Main function to calculate the amount per shift

export const calculateShiftPay = (startTime, endTime, baseRate, travelRate) => {
  // at first check for night shifts
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (end < start) end.setDate(end.getDate() + 1);

  const totalHours = (end - start) / (1000 * 60 * 60);

  //1. Determinate if its a weekend shift (Fri 16:00 to Sun 04:00)
  const isWeekend =
    (start.getDay() === 5 && start.getHours() >= 16) ||
    start.getDay() === 6 ||
    (start.getDay() === 0 && start.getHours() < 4);

  // initilize empty amount to store the values
  let totalPay = 0;
  let reg_hours = Math.min(totalHours, 8);
  let extra_hours = Math.max(0, totalHours - 8);

  //first check for weekend pay
  if (isWeekend) {
    // Weekend Rates: Reg (150%) ,First 2 extra hours (175%) , Remaining (200%)
    totalPay += reg_hours * (baseRate * 1.5);

    if (extra_hours > 0) {
      const first2Extra = Math.min(extra_hours, 2);
      const remainingExtra = Math.max(0, extra_hours - 2);
      totalPay +=
        first2Extra * (baseRate * 1.75) + remainingExtra * (baseRate * 2.0);
    }
  } else {
    // Weekday Rates: Reg(100%), First 2 extra hours (125%) , Reamining (150%)
    totalPay += reg_hours * baseRate;
    if (extra_hours > 0) {
      const first2Extra = Math.min(extra_hours, 2);
      const remainingExtra = Math.max(0, extra_hours - 2);
      totalPay +=
        first2Extra * (baseRate * 1.25) + remainingExtra * (baseRate * 1.5);
    }
  }
  // Add the travel rate
  totalPay += Number(travelRate || 0);

  return {
    total_amount: totalPay.toFixed(2),
    reg_hours: reg_hours.toFixed(2),
    extra_hours: extra_hours.toFixed(2),
  };
};
