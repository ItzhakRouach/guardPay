// Reminder time persistence. The profile stores the weekly reminder as a
// plain "HH:MM" string. It used to be written with toLocaleTimeString, which
// on some locales produced "6:05 PM" or "24:00" and then failed to parse
// back into a schedulable hour/minute.

const pad = (n) => String(n).padStart(2, "0");

function formatHHMM(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** @returns {{hour:number, minute:number}|null} */
function parseReminderTime(str) {
  if (typeof str !== "string") return null;
  const m = str.trim().match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])?$/);
  if (!m) return null;
  let hour = Number(m[1]);
  const minute = Number(m[2]);
  const ampm = m[3] ? m[3].toUpperCase() : null;
  if (ampm === "PM" && hour < 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;
  if (hour === 24 && minute === 0) hour = 0;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

module.exports = { formatHHMM, parseReminderTime };
