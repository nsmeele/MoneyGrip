import { createContext } from 'react';
import type { SupportedLanguage } from '../i18n/languages';
import type { Currency } from '../enums/Currency';

export interface LocaleContextValue {
  language: SupportedLanguage;
  currency: Currency;
  setCurrency: (c: Currency) => void;
}

export const LocaleContext = createContext<LocaleContextValue | null>(null);
