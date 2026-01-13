import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import { resources } from "./translations";

i18n.use(initReactI18next).init({
  resources: resources,
  lng: Localization.getLocales()[0].languageCode,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
