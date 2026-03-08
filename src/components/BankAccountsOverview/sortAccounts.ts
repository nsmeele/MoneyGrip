import type { BankAccount } from '../../models/BankAccount';

export type SortColumn = 'balance' | 'endDate';
export type SortDirection = 'asc' | 'desc';
export type SortState = { column: SortColumn; direction: SortDirection } | null;

export function sortAccounts(results: BankAccount[], sortState: SortState): BankAccount[] {
  const sorted = [...results];

  if (!sortState) {
    return sorted.sort((a, b) => {
      if (!a.endDate && !b.endDate) return 0;
      if (!a.endDate) return -1;
      if (!b.endDate) return 1;
      return a.endDate.localeCompare(b.endDate);
    });
  }

  const dir = sortState.direction === 'asc' ? 1 : -1;

  return sorted.sort((a, b) => {
    switch (sortState.column) {
      case 'balance':
        return (a.effectiveBalance - b.effectiveBalance) * dir;
      case 'endDate': {
        if (!a.endDate && !b.endDate) return 0;
        if (!a.endDate) return dir;
        if (!b.endDate) return -dir;
        return a.endDate.localeCompare(b.endDate) * dir;
      }
    }
  });
}
