import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getLanguage, setLanguage as setI18nLanguage, t as translate, type AppLanguage } from "../../i18n";

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage | "pt" | "en") => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function normalizeLanguage(value: string | null | undefined): AppLanguage {
  if (value === "en" || value === "en-US") {
    return "en-US";
  }

  return "pt-BR";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(() => normalizeLanguage(localStorage.getItem("soccermind_language")));

  useEffect(() => {
    setI18nLanguage(language);
    localStorage.setItem("soccermind_language", language);
  }, [language]);

  useEffect(() => {
    if (getLanguage() !== language) {
      setI18nLanguage(language);
    }
  }, [language]);

  const value = useMemo<LanguageContextType>(
    () => ({
      language,
      setLanguage: (nextLanguage) => {
        setLanguageState(normalizeLanguage(nextLanguage));
      },
      t: (key, params) => translate(key, params),
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }

  return context;
}
