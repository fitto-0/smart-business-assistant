import { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import translations from "./translations";

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export const LanguageProvider = ({ children, userLanguage }) => {
  const [language, setLanguageState] = useState("en");

  useEffect(() => {
    // Priority: userLanguage from backend > cookie > localStorage > default
    const savedLanguage = userLanguage || Cookies.get("language") || localStorage.getItem("language") || "en";
    setLanguageState(savedLanguage);
  }, [userLanguage]);

  const setLanguage = (lang) => {
    setLanguageState(lang);
    Cookies.set("language", lang, { expires: 365 });
    localStorage.setItem("language", lang);
  };

  const t = (key) => {
    const keys = key.split(".");
    let value = translations[language];
    
    for (const k of keys) {
      if (value && value[k]) {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    return value;
  };

  const value = {
    language,
    setLanguage,
    t,
    translations
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
