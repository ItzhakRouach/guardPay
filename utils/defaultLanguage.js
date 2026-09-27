// Which UI language to start with. A saved choice always wins; otherwise
// follow the phone when we have that vocabulary, else English.

const SUPPORTED = ["en", "he", "ar"];

function normalize(code) {
  if (typeof code !== "string" || !code) return null;
  const base = code.toLowerCase().split(/[-_]/)[0];
  if (base === "iw") return "he"; // legacy Hebrew code still emitted by some devices
  return base;
}

function pickDefaultLanguage(saved, deviceCode) {
  const s = normalize(saved);
  if (s && SUPPORTED.includes(s)) return s;
  const d = normalize(deviceCode);
  if (d && SUPPORTED.includes(d)) return d;
  return "en";
}

module.exports = { pickDefaultLanguage, SUPPORTED_LANGUAGES: SUPPORTED };
