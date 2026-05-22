import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";
import i18n from "../translations/il18n";

const LanguageContext = createContext();

// Locales that should render right-to-left. Centralised so adding a new RTL
// language (e.g. Arabic once its vocabulary block lands) only requires
// updating this list — not chasing hardcoded `=== "he"` checks.
const RTL_LANGUAGES = new Set(["he", "ar"]);
const isRtlLanguage = (lang) => RTL_LANGUAGES.has(lang);

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(i18n.language || "en");
  const [isRTL, setIsRTL] = useState(isRtlLanguage(i18n.language));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const savedLang = await AsyncStorage.getItem("user-language");
        const langToUse = savedLang || "en";
        await i18n.changeLanguage(langToUse);
        setLang(langToUse);
        setIsRTL(isRtlLanguage(langToUse));
      } catch (error) {
        console.error("Failed to load language", error);
      } finally {
        setLoading(false);
      }
    };

    loadSavedLanguage();
  }, []);

  const changeLanguage = async (next) => {
    try {
      await i18n.changeLanguage(next);
      await AsyncStorage.setItem("user-language", next);
      setLang(next);
      setIsRTL(isRtlLanguage(next));
    } catch (e) {
      console.log("error in loading the language", e);
    }
  };

  return (
    <LanguageContext.Provider
      value={{ isRTL, setIsRTL, changeLanguage, lang, loading }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
