import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { pickDefaultLanguage } from "../utils/defaultLanguage";
import { resources } from "./vocabulary";

// Initial language = the phone's, when we have that vocabulary (he / ar /
// en), else English. LanguageProvider then applies the user's saved choice,
// if any, before the first screen renders.
i18n.use(initReactI18next).init({
  resources: resources,
  lng: pickDefaultLanguage(null, Localization.getLocales()?.[0]?.languageCode),
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
