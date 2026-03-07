export enum Currency {
  EUR = 'EUR',
  USD = 'USD',
  GBP = 'GBP',
  CHF = 'CHF',
  JPY = 'JPY',
  CAD = 'CAD',
  AUD = 'AUD',
  SEK = 'SEK',
  NOK = 'NOK',
  DKK = 'DKK',
  PLN = 'PLN',
}

export const DEFAULT_CURRENCY = Currency.EUR;

export const SUPPORTED_CURRENCIES: Currency[] = Object.values(Currency) as Currency[];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  [Currency.EUR]: '\u20AC',
  [Currency.USD]: '$',
  [Currency.GBP]: '\u00A3',
  [Currency.CHF]: 'Fr',
  [Currency.JPY]: '\u00A5',
  [Currency.CAD]: 'CA$',
  [Currency.AUD]: 'A$',
  [Currency.SEK]: 'kr',
  [Currency.NOK]: 'kr',
  [Currency.DKK]: 'kr',
  [Currency.PLN]: 'z\u0142',
};
