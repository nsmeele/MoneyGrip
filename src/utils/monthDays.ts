import type { BankAccount } from '../models/BankAccount';
import { expandCashFlows } from '../models/CashFlow';
import { addMonthsToISO, getNextMonthStart, parseDate, toISO } from './date';
import { yearFraction } from './dayCount';
import { getRateForDate } from './rateChange';

export interface DayRow {
  date: string;
  balance: number;
  rate: number;
  dayInterest: number;
  cumulative: number;
}

function addDay(iso: string): string {
  const d = parseDate(iso);
  d.setDate(d.getDate() + 1);
  return toISO(d);
}

export function getMonthDays(account: BankAccount, monthKey: string): DayRow[] {
  if (!account.startDate || account.periods.length === 0) return [];

  const monthStart = `${monthKey}-01`;
  const monthEnd = getNextMonthStart(monthStart);
  const endISO = account.endDate ?? addMonthsToISO(account.startDate, account.durationMonths);
  const allCashFlows = expandCashFlows(account.cashFlows, endISO);

  const dayMap = new Map<string, { balance: number; rate: number }>();

  for (let i = 0; i < account.periods.length; i++) {
    const period = account.periods[i];
    const periodStart = i === 0 ? account.startDate : account.periods[i - 1].endDate!;
    const periodEnd = period.endDate;
    if (!periodEnd) continue;
    if (periodEnd <= monthStart || periodStart >= monthEnd) continue;

    let balance = period.startBalance;

    for (const cf of allCashFlows) {
      if (cf.date >= periodStart && cf.date < monthStart) {
        balance = Math.max(0, balance + Math.max(-balance, cf.amount));
      }
    }

    const sliceStart = periodStart > monthStart ? periodStart : monthStart;
    const sliceEnd = periodEnd < monthEnd ? periodEnd : monthEnd;

    let day = sliceStart;
    while (day < sliceEnd) {
      for (const cf of allCashFlows) {
        if (cf.date === day && day >= periodStart) {
          balance = Math.max(0, balance + Math.max(-balance, cf.amount));
        }
      }

      const rate = getRateForDate(account.rateChanges, account.annualInterestRate, day);
      dayMap.set(day, { balance, rate });
      day = addDay(day);
    }
  }

  const rows: DayRow[] = [];
  let cumulative = 0;

  let cursor = monthStart;
  while (cursor < monthEnd) {
    const entry = dayMap.get(cursor);
    if (entry) {
      const nextDay = addDay(cursor);
      const dayInterest = entry.balance * (entry.rate / 100) * yearFraction(cursor, nextDay, account.dayCount);
      cumulative += dayInterest;
      rows.push({ date: cursor, balance: entry.balance, rate: entry.rate, dayInterest, cumulative });
    }
    cursor = addDay(cursor);
  }

  return rows;
}
