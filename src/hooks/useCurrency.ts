import { createContext, useContext, useState, useCallback } from 'react';
import { Currency, DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from '../enums/Currency';

export { Currency } from '../enums/Currency';

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
}

export const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const STORAGE_KEY = 'currency';

function getInitialCurrency(): Currency {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_CURRENCIES.includes(stored as Currency)) {
      return stored as Currency;
    }
  } catch { /* localStorage unavailable */ }
  return DEFAULT_CURRENCY;
}

export function useCurrencyProvider(): CurrencyContextValue {
  const [currency, setCurrencyState] = useState<Currency>(getInitialCurrency);

  const setCurrency = useCallback((c: Currency) => {
    try { localStorage.setItem(STORAGE_KEY, c); } catch { /* storage unavailable */ }
    setCurrencyState(c);
  }, []);

  return { currency, setCurrency };
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyContext.Provider');
  return ctx;
}
