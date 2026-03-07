import i18n, { LOCALE_MAP } from '../i18n';
import type { SupportedLanguage } from '../i18n';
import { parseDate } from './date';

function getLocale(): string {
  return LOCALE_MAP[i18n.language as SupportedLanguage] ?? 'nl-NL';
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat(getLocale(), {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
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
