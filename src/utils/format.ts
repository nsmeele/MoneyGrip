import i18n, { LOCALE_MAP } from '../i18n';
import type { SupportedLanguage } from '../i18n';
import { parseDate } from './date';
import { createCurrency, type Currency } from '../enums/Currency';

function getLocale(): string {
  return LOCALE_MAP[i18n.language as SupportedLanguage] ?? 'nl-NL';
}

export function formatCurrency(value: number, currencyCode: string): string {
  return createCurrency(value, currencyCode as Currency).format();
}

export function formatDuration(months: number): string {
  const j = Math.floor(months / 12);
  const m = months % 12;
  if (m === 0) return i18n.t('format.years', { count: j });
  if (j === 0) return i18n.t('format.months', { count: m });
  return i18n.t('format.yearsMonths', { years: j, months: m });
}

export function formatDate(isoString: string): string {
  return new Intl.DateTimeFormat(getLocale(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parseDate(isoString));
}

export function formatDurationShort(months: number): string {
  const j = Math.floor(months / 12);
  const m = months % 12;
  if (m === 0) return i18n.t('format.yearsShort', { count: j });
  if (j === 0) return i18n.t('format.monthsShort', { count: m });
  return i18n.t('format.yearsMonthsShort', { years: j, months: m });
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(getLocale(), options).format(value);
}

export function formatRate(rate: number, currencyCode: Currency): string {
  const precision = Number.isInteger(rate) ? 1 : 2;
  return createCurrency(rate, currencyCode).format({ symbol: '', precision }).trim();
}

export function formatAccountLabel(balance: number, rate: number, currencyCode: string): string {
  return `${formatCurrency(balance, currencyCode)} @ ${formatRate(rate, currencyCode as Currency)}%`;
}

export function formatAmountInput(value: string | number, currencyCode: Currency): string {
  return createCurrency(value, currencyCode).format({ symbol: '' }).trim();
}

export function parseAmountInput(value: string, currencyCode: Currency): number {
  return createCurrency(value, currencyCode).value;
}
