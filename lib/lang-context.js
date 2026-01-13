import React, { createContext, useState, useContext, useEffect } from "react";
import { I18nManager } from "react-native";
import i18n from "../Langueges/il18n";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [isRTL, setIsRTL] = useState(i18n.language === "he");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const savedLang = await AsyncStorage.getItem("user-language");
        if (savedLang) {
          await i18n.changeLanguage(savedLang);
          const shouldBeRTL = savedLang === "he";
          setIsRTL(shouldBeRTL);

          // Keep I18nManager in sync with the saved preference
          if (I18nManager.isRTL !== shouldBeRTL) {
            I18nManager.allowRTL = shouldBeRTL;
            I18nManager.forceRTL = shouldBeRTL;
          }
        }
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
      const isRTLChosen = lang === "he";
      await i18n.changeLanguage(lang);
      await AsyncStorage.setItem("user-language", lang);
      setIsRTL(isRTLChosen);

      if (I18nManager.isRTL !== isRTLChosen) {
        I18nManager.allowRTL = isRTLChosen;
        I18nManager.forceRTL = isRTLChosen;
      }
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
