import { parseDate, toISO, addMonthsToDate } from '../utils/date';

export interface CashFlow {
  id: string;
  date: string;
  amount: number;
  description: string;
  recurring?: {
    intervalMonths: number;
    endDate?: string;
  };
  transferId?: string;
}

export interface ExpandedCashFlow {
  date: string;
  amount: number;
  sourceId?: string;
}

export interface RecurringAutoEntry {
  date: string;
  amount: number;
  description: string;
}

export function getRecurringAutoEntries(
  cashFlows: CashFlow[],
  endDate: string,
  inWindow?: (date: string) => boolean,
): RecurringAutoEntry[] {
  return cashFlows
    .filter((cf) => cf.recurring)
    .flatMap((cf) =>
      expandCashFlows([cf], endDate)
        .filter((e) => e.date !== cf.date && (inWindow ? inWindow(e.date) : true))
        .map((e) => ({ date: e.date, amount: e.amount, description: cf.description })),
    );
}

export function expandCashFlows(
  cashFlows: CashFlow[],
  endDate: string,
): ExpandedCashFlow[] {
  const expanded: ExpandedCashFlow[] = [];
  const end = parseDate(endDate);

  for (const cf of cashFlows) {
    if (cf.recurring) {
      let current = parseDate(cf.date);
      const recurringEnd = cf.recurring.endDate ? parseDate(cf.recurring.endDate) : end;
      const effectiveEnd = recurringEnd < end ? recurringEnd : end;

      while (current <= effectiveEnd) {
        expanded.push({ date: toISO(current), amount: cf.amount, sourceId: cf.id });
        current = addMonthsToDate(current, cf.recurring.intervalMonths);
      }
    } else {
      expanded.push({ date: cf.date, amount: cf.amount });
    }
  }

  // Sort by date, deposits before withdrawals on same date
  return expanded.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return b.amount - a.amount;
  });
}
