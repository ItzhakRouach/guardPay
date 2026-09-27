/* global describe, test, expect */
const { pickDefaultLanguage } = require("../utils/defaultLanguage");

describe("pickDefaultLanguage", () => {
  test("saved choice always wins", () => {
    expect(pickDefaultLanguage("en", "he")).toBe("en");
    expect(pickDefaultLanguage("ar", "en")).toBe("ar");
  });
  test("no saved choice → follow the phone when supported", () => {
    expect(pickDefaultLanguage(null, "he")).toBe("he");
    expect(pickDefaultLanguage(null, "ar")).toBe("ar");
    expect(pickDefaultLanguage(null, "en")).toBe("en");
    expect(pickDefaultLanguage(null, "iw")).toBe("he"); // legacy Hebrew code
  });
  test("unsupported or missing phone language → English", () => {
    expect(pickDefaultLanguage(null, "ru")).toBe("en");
    expect(pickDefaultLanguage(null, undefined)).toBe("en");
  });
  test("a saved value that is no longer supported falls back", () => {
    expect(pickDefaultLanguage("fr", "he")).toBe("he");
  });
});
