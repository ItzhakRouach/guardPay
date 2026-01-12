import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import { resources } from "./translations";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18nManager } from "react-native";

const loadLanguege = async () => {
  try {
    const saveLang = await AsyncStorage.getItem("user-languege");
    if (saveLang) {
      i18n.changeLanguage(saveLang);

      const isRTL = saveLang === "he";
      if (I18nManager.isRTL !== isRTL) {
        I18nManager.forceRTL = true;
        I18nManager.allowRTL = true;
      }
    }
  } catch (err) {
    console.log(err);
  }
};

i18n.use(initReactI18next).init({
  resources: resources,
  // recognize device languege
  lng: Localization.getLocales()[0].languageCode,
  fallbackLng: "en", // default english
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
