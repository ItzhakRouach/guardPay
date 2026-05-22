// Pure helpers for normalizing user-typed decimal numbers.
//
// Kept as CommonJS so the Jest test suite can `require()` it directly
// without needing a babel config (the project's babel/metro setup is
// otherwise provided by Expo at runtime, and we don't want to introduce
// a top-level babel.config.js that could shadow Expo's preset).

const normalizeDecimal = (val) => {
  if (val === undefined || val === null) return "";
  const onlyDigitsAndDot = String(val)
    .replace(/,/g, ".")
    .replace(/[^0-9.]/g, "");
  const firstDot = onlyDigitsAndDot.indexOf(".");
  if (firstDot === -1) return onlyDigitsAndDot;
  return (
    onlyDigitsAndDot.slice(0, firstDot + 1) +
    onlyDigitsAndDot.slice(firstDot + 1).replace(/\./g, "")
  );
};

module.exports = { normalizeDecimal };
