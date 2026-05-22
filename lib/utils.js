// Re-export the pure CJS decimal helper so app code imports from one place.
// Tests `require("../utils/decimal")` directly to avoid needing a babel config.
export { normalizeDecimal } from "../utils/decimal";

// Map an i18next language code to the Intl locale used for runtime date
// formatting. Israeli Arab users get `ar-IL` so month + weekday strings
// render with Levantine names (شباط, الجمعة) — the `ar` locale alone
// can fall back to Egyptian/Western names on some Hermes/JSC builds.
export const localeFromLang = (lang) => {
  if (lang === "he") return "he-IL";
  if (lang === "ar") return "ar-IL";
  return "en-US";
};

//function to format the  shift time
export const formatShiftTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

// function to format the shift date
export const formatShiftDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB"); // Outputs: DD/MM/YYYY
};

export const formatDate = (dateInput) => {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return dateInput;
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${year}`;
};

// function to format the dates
export const formatDates = (d) => {
  if (!d) return "N/A";
  const [year, month, day] = d.split("T")[0].split("-");
  return `${day}/${month}/${year.slice(-2)}`;
};

//create config of shift type times
export const shiftTypeTimes = {
  morning: { startH: 7, startM: 0, endH: 15, endM: 0 },
  evening: { startH: 15, startM: 0, endH: 23, endM: 0 },
  night: { startH: 23, startM: 0, endH: 7, endM: 0 },
  training: { startH: 7, startM: 0, endH: 15, endM: 0 },
  vacation: { startH: 7, startM: 0, endH: 15, endM: 0 },
  holiday: { startH: 7, startM: 0, endH: 15, endM: 0 },
};

//Added , to the amount better visually , so 1250.1 turn to 1,250.1
export const formattedAmount = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "0.00";
  }
  const numericValue = Number(amount);
  const val = numericValue.toFixed(2);

  return Number(val).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
