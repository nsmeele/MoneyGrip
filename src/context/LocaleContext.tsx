import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../i18n/languages';
import type { SupportedLanguage } from '../i18n/languages';
import { Currency, DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from '../enums/Currency';
import { LocaleContext } from './localeContextValue';

const CURRENCY_STORAGE_KEY = 'currency';
const FALLBACK_LANGUAGE: SupportedLanguage = 'en';
const supportedCodes = SUPPORTED_LANGUAGES.map(({ code }) => code) as readonly string[];

function getInitialCurrency(): Currency {
  try {
    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (stored && SUPPORTED_CURRENCIES.includes(stored as Currency)) {
      return stored as Currency;
    }
  } catch { /* localStorage unavailable */ }
  return DEFAULT_CURRENCY;
}

function validateLanguage(lang: string | undefined): SupportedLanguage {
  if (lang && supportedCodes.includes(lang)) {
    return lang as SupportedLanguage;
  }
  return FALLBACK_LANGUAGE;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const { lang } = useParams();
  const language = validateLanguage(lang);
  const { i18n } = useTranslation();

  useEffect(() => {
    if (language !== i18n.language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  const [currency, setCurrencyState] = useState<Currency>(getInitialCurrency);

  const setCurrency = useCallback((c: Currency) => {
    try { localStorage.setItem(CURRENCY_STORAGE_KEY, c); } catch { /* storage unavailable */ }
    setCurrencyState(c);
  }, []);

  return (
    <LocaleContext.Provider value={{ language, currency, setCurrency }}>
      {children}
    </LocaleContext.Provider>
  );
}
