import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";
import i18n from "../translations/il18n";

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [isRTL, setIsRTL] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const savedLang = await AsyncStorage.getItem("user-language");
        const langToUse = savedLang || "en";
        const shouldBeRTL = langToUse === "he";
        await i18n.changeLanguage(langToUse);
        setIsRTL(shouldBeRTL);
      } catch (error) {
        console.error("Failed to load language", error);
      } finally {
        setLoading(false);
      }
    };

    loadSavedLanguage();
  }, []);

  const changeLanguage = async (lang) => {
    try {
      const shouldBeRTL = lang === "he";
      console.log("🛑 CRITICAL CHECK: Button sent me ->", lang);
      await i18n.changeLanguage(lang);
      await AsyncStorage.setItem("user-language", lang);
      setIsRTL(shouldBeRTL);
    } catch (e) {
      console.log("error in loading the language", e);
    }
  };

  return (
    <LanguageContext.Provider
      value={{ isRTL, setIsRTL, changeLanguage, lang: i18n.language, loading }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
