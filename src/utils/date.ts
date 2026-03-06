import { parseISO, differenceInMonths, differenceInDays, addDays, addMonths as dfnsAddMonths, lastDayOfMonth, format, isBefore } from 'date-fns';

export function parseDate(iso: string): Date {
  return parseISO(iso);
}

export function monthsBetween(startISO: string, endISO: string): number {
  return differenceInMonths(parseISO(endISO), parseISO(startISO));
}

export function addMonthsToISO(iso: string, months: number): string {
  return toISO(dfnsAddMonths(parseISO(iso), months));
}

export function addMonthsToDate(date: Date, months: number): Date {
  return dfnsAddMonths(date, months);
}

export function toISO(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function isBeforeDate(a: string, b: string): boolean {
  return isBefore(parseISO(a), parseISO(b));
}

export function getYear(iso: string): number {
  return parseISO(iso).getFullYear();
}

export function getMonth(iso: string): number {
  return parseISO(iso).getMonth();
}

export function addDayISO(iso: string): string {
  return toISO(addDays(parseISO(iso), 1));
}

export function daysBetween(startISO: string, endISO: string): number {
  return differenceInDays(parseISO(endISO), parseISO(startISO));
}

const QUARTER_MONTHS = [0, 3, 6, 9]; // Jan, Apr, Jul, Oct

export function getNextQuarterStart(iso: string): string {
  const date = parseISO(iso);
  const month = date.getMonth();

  for (const qm of QUARTER_MONTHS) {
    if (qm > month) {
      return toISO(new Date(date.getFullYear(), qm, 1));
    }
  }
  return toISO(new Date(date.getFullYear() + 1, 0, 1));
}

export function getNextMonthStart(iso: string): string {
  const date = parseISO(iso);
  return toISO(new Date(date.getFullYear(), date.getMonth() + 1, 1));
}

export function endOfMonthISO(iso: string): string {
  return toISO(lastDayOfMonth(parseISO(iso)));
}

export function toMonthKey(iso: string): string {
  const d = parseISO(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
