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

// function to format the dates
export const formatDates = (d) => {
  if (!d) return "N/A";
  const [year, month, day] = d.split("T")[0].split("-");
  return `${day}/${month}/${year.slice(-2)}`;
};

// fuction to return only 2 character name
export const initalName = (name) => {
  if (!name) return "??";
  const parts = name.trim().split(" ");
  const first = parts[0]?.charAt(0) || "";
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
  return (first + last).toUpperCase();
};

//create config of shift type times
export const shiftTypeTimes = {
  morning: { startH: 7, startM: 0, endH: 15, endM: 0 },
  evening: { startH: 15, startM: 0, endH: 23, endM: 0 },
  night: { startH: 23, startM: 0, endH: 7, endM: 0 },
};
