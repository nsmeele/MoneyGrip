import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import nl from './nl.json';
import en from './en.json';

export { SUPPORTED_LANGUAGES, LOCALE_MAP } from './languages';
export type { SupportedLanguage } from './languages';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      nl: { translation: nl },
      en: { translation: en },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

if (typeof document !== 'undefined') {
  i18n.on('languageChanged', (lng) => {
    document.documentElement.lang = lng;
  });
  document.documentElement.lang = i18n.language;
}

export default i18n;
