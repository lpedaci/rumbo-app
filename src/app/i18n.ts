import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import es from '@/locales/es.json';

export const SUPPORTED_LANGUAGES = ['es', 'en'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = 'es';

void i18n.use(initReactI18next).init({
  // Spanish ships with the app; English loads on demand the first time it is used, so it
  // does not weigh on the first load (RNF-005, D-99).
  resources: {
    es: { translation: es },
  },
  partialBundledLanguages: true,
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: SUPPORTED_LANGUAGES,
  interpolation: {
    // React already escapes rendered text.
    escapeValue: false,
  },
  returnNull: false,
});

// Keep <html lang> in sync with the active language (WCAG 3.1.1).
const syncDocumentLanguage = (lng: string) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng;
  }
};
syncDocumentLanguage(i18n.language);
i18n.on('languageChanged', (lng) => {
  syncDocumentLanguage(lng);
  if (lng === 'en' && !i18n.hasResourceBundle('en', 'translation')) {
    void import('@/locales/en.json').then((m) => {
      i18n.addResourceBundle('en', 'translation', m.default, true, true);
      // Re-render with the loaded texts, only if English is still the chosen language
      // (someone may have switched back while it loaded).
      if (i18n.language === 'en') void i18n.changeLanguage('en');
    });
  }
});

export default i18n;
