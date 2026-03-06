import type { BankAccount } from '../models/BankAccount';
import { addMonthsToISO, toMonthKey } from './date';

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
  const last = sorted[sorted.length - 1];
  const all: string[] = [];
  let cursor = `${sorted[0]}-01`;

  while (toMonthKey(cursor) <= last) {
    all.push(toMonthKey(cursor));
    cursor = addMonthsToISO(cursor, 1);
  }
  return all;
}

export function buildPortfolioChartData(
  items: BankAccount[],
  projectionKey: 'accrued' | 'disbursed' = 'accrued',
): ChartDataPoint[] {
  const withDates = items.filter((r) => r.startDate);
  if (withDates.length === 0) return [];

  const combined = new Map<string, number>();
  for (const item of withDates) {
    const projection = projectionKey === 'disbursed'
      ? item.calendarMonthDisbursement
      : item.calendarMonthProjection;
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
