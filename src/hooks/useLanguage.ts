import { useState, useEffect } from "react";
import { SupportedLanguage, languageConfig, LanguageConfigDetail } from "../config/languageConfig";

// Subscriber store pattern to guarantee absolute reactive state synchronicity without refresh
type LanguageListener = (lang: SupportedLanguage) => void;
let globalLanguage: SupportedLanguage = "en";
const listeners = new Set<LanguageListener>();

export const setGlobalLanguage = (lang: SupportedLanguage) => {
  globalLanguage = lang;
  listeners.forEach(listener => listener(lang));
};

export const useLanguage = () => {
  const [langState, setLangState] = useState<SupportedLanguage>(globalLanguage);

  useEffect(() => {
    const handleUpdate = (nextLang: SupportedLanguage) => {
      setLangState(nextLang);
    };
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  return {
    language: langState,
    config: languageConfig[langState],
    setLanguage: (lang: SupportedLanguage) => {
      console.log("Language:", lang);
      setGlobalLanguage(lang);
    }
  };
};
