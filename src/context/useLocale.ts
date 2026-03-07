import { useContext } from 'react';
import { LocaleContext } from './localeContextValue';
import type { LocaleContextValue } from './localeContextValue';

export type { LocaleContextValue };

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
