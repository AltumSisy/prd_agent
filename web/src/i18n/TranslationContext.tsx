// ============================================
// Translation Context Provider
// Provides language switching capability across components
// ============================================

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { translations, Language } from './translations';

// Context type definition
interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

// Create context with undefined default
const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

// Provider component - wraps the entire app
export function TranslationProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('zh');

  // Translation function - retrieves nested keys like 'features.naturalLanguage.title'
  const t = useCallback((key: string): string => {
    const keys = key.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Return key itself if translation not found
        return key;
      }
    }

    return typeof value === 'string' ? value : key;
  }, [language]);

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

// Custom hook for accessing translation context
// Must be used within TranslationProvider
export function useTranslation(): TranslationContextType {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within TranslationProvider');
  }
  return context;
}