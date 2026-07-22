import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import i18n from '../i18n';
import { getItem, setItem } from '../services/storage';

interface LanguageContextType {
  language: string;
  setLanguage: (lng: string) => void;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const LANG_KEY = '@cervitrack_language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState(i18n.language || 'en');

  useEffect(() => {
    (async () => {
      const stored = await getItem(LANG_KEY);
      if (stored && stored !== i18n.language) {
        setLanguageState(stored);
        i18n.changeLanguage(stored);
      }
    })();
  }, []);

  const setLanguage = useCallback((lng: string) => {
    setLanguageState(lng);
    i18n.changeLanguage(lng);
    setItem(LANG_KEY, lng);
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

export default LanguageContext;
