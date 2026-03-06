import type { BankAccount } from '../models/BankAccount';
import { PayoutInterval, getPeriodsPerYear } from '../enums/PayoutInterval';
import { getYear, getMonth } from './date';

export function interestPerMonth(result: BankAccount): number {
  if (result.durationMonths === 0) return 0;
  return result.totalInterest / result.durationMonths;
}

function toMonthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

function addMonths(year: number, month: number, count: number): [number, number] {
  const total = year * 12 + month + count;
  return [Math.floor(total / 12), total % 12];
}

function projectToCalendarMonths(result: BankAccount): Map<string, number> {
  const map = new Map<string, number>();
  if (!result.startDate) return map;

  const startYear = getYear(result.startDate);
  const startMonth = getMonth(result.startDate);

  if (result.interval === PayoutInterval.AtMaturity || result.interval === PayoutInterval.Daily) {
    const monthlyShare = result.totalInterest / result.durationMonths;
    for (let i = 0; i < result.durationMonths; i++) {
      const [y, m] = addMonths(startYear, startMonth, i);
      const key = toMonthKey(y, m);
      map.set(key, (map.get(key) ?? 0) + monthlyShare);
    }
    return map;
  }

  const periodsPerYear = getPeriodsPerYear(result.interval);
  const monthsPerPeriod = 12 / periodsPerYear;

  for (let i = 0; i < result.periods.length; i++) {
    const period = result.periods[i];
    const periodStartOffset = Math.round(i * monthsPerPeriod);
    const periodEndOffset = Math.round((i + 1) * monthsPerPeriod);
    const spanMonths = Math.max(1, periodEndOffset - periodStartOffset);
    const monthlyShare = period.interestEarned / spanMonths;

    for (let j = periodStartOffset; j < periodEndOffset; j++) {
      const [y, m] = addMonths(startYear, startMonth, j);
      const key = toMonthKey(y, m);
      map.set(key, (map.get(key) ?? 0) + monthlyShare);
    }
  }

  return map;
}

export interface ChartDataPoint {
  monthKey: string;
  label: string;
  interest: number;
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  const d = new Date(year, month - 1, 1);
  const label = new Intl.DateTimeFormat('nl-NL', { month: 'short' }).format(d);
  return `${label} '${String(year).slice(2)}`;
}

function fillMonthGaps(keys: string[]): string[] {
  if (keys.length === 0) return [];
  const sorted = [...keys].sort();
  const [startY, startM] = sorted[0].split('-').map(Number);
  const [endY, endM] = sorted[sorted.length - 1].split('-').map(Number);
  const all: string[] = [];
  let y = startY;
  let m = startM - 1;
  const endTotal = endY * 12 + (endM - 1);

  while (y * 12 + m <= endTotal) {
    all.push(toMonthKey(y, m));
    [y, m] = addMonths(y, m, 1);
  }
  return all;
}

export function buildPortfolioChartData(items: BankAccount[]): ChartDataPoint[] {
  const withDates = items.filter((r) => r.startDate);
  if (withDates.length === 0) return [];

  const combined = new Map<string, number>();
  for (const item of withDates) {
    const projection = projectToCalendarMonths(item);
    for (const [key, value] of projection) {
      combined.set(key, (combined.get(key) ?? 0) + value);
    }
  }

  const allMonths = fillMonthGaps([...combined.keys()]);
  return allMonths.map((monthKey) => ({
    monthKey,
    label: formatMonthLabel(monthKey),
    interest: combined.get(monthKey) ?? 0,
  }));
}
