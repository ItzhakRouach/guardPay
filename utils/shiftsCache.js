// Pure helpers for the shared shifts store (hooks/shifts-store.js): month
// keys, month query bounds, and reading Appwrite realtime events.
// CommonJS so Jest can require it directly.

function monthKeyOf(dateLike) {
  if (dateLike == null) return null;
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${d.getMonth()}`;
}

/** Same bounds useShift has always queried with (local month, inclusive). */
function monthRangeIso(year, monthIndex) {
  return {
    start: new Date(year, monthIndex, 1).toISOString(),
    end: new Date(year, monthIndex + 1, 0, 23, 59, 59).toISOString(),
  };
}

function eventKind(response) {
  const events =
    response && Array.isArray(response.events) ? response.events : [];
  for (const kind of ["create", "update", "delete"]) {
    if (events.some((e) => typeof e === "string" && e.endsWith(`.${kind}`))) {
      return kind;
    }
  }
  return null;
}

function eventMonthKey(response) {
  return monthKeyOf(
    response && response.payload && response.payload.start_time,
  );
}

function isMyEvent(response, userId) {
  return !!userId && !!response?.payload && response.payload.user_id === userId;
}

module.exports = {
  monthKeyOf,
  monthRangeIso,
  eventKind,
  eventMonthKey,
  isMyEvent,
};
