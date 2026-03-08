import { describe, it, expect } from 'vitest';
import { getRecurringAutoEntries } from '../models/CashFlow';
import type { CashFlow } from '../models/CashFlow';

describe('getRecurringAutoEntries', () => {
  it('returns expanded instances excluding the source date', () => {
    const cashFlows: CashFlow[] = [{
      id: '1', date: '2026-02-25', amount: 100, description: 'Maandelijkse storting',
      recurring: { intervalMonths: 1 },
    }];
    const result = getRecurringAutoEntries(cashFlows, '2026-12-31');
    expect(result[0].date).toBe('2026-03-25');
    expect(result.every((e) => e.date !== '2026-02-25')).toBe(true);
  });

  it('returns all future recurring instances within the end date', () => {
    const cashFlows: CashFlow[] = [{
      id: '1', date: '2026-03-25', amount: 100, description: 'Maandelijkse storting',
      recurring: { intervalMonths: 1 },
    }];
    const result = getRecurringAutoEntries(cashFlows, '2026-06-30');
    expect(result.map((e) => e.date)).toEqual([
      '2026-04-25', '2026-05-25', '2026-06-25',
    ]);
  });

  it('preserves description from the source cashflow', () => {
    const cashFlows: CashFlow[] = [{
      id: '1', date: '2026-01-01', amount: 200, description: 'Kwartaalstorting',
      recurring: { intervalMonths: 3 },
    }];
    const result = getRecurringAutoEntries(cashFlows, '2026-12-31');
    expect(result.every((e) => e.description === 'Kwartaalstorting')).toBe(true);
  });

  it('filters results by window function when provided', () => {
    const cashFlows: CashFlow[] = [{
      id: '1', date: '2026-01-15', amount: 100, description: 'Maandelijks',
      recurring: { intervalMonths: 1 },
    }];
    const inWindow = (date: string) => date >= '2026-03-01' && date <= '2026-04-30';
    const result = getRecurringAutoEntries(cashFlows, '2026-12-31', inWindow);
    expect(result.map((e) => e.date)).toEqual(['2026-03-15', '2026-04-15']);
  });

  it('ignores non-recurring cashflows', () => {
    const cashFlows: CashFlow[] = [
      { id: '1', date: '2026-01-01', amount: 500, description: 'Eenmalig' },
      { id: '2', date: '2026-01-01', amount: 100, description: 'Maandelijks', recurring: { intervalMonths: 1 } },
    ];
    const result = getRecurringAutoEntries(cashFlows, '2026-03-31');
    expect(result.every((e) => e.description === 'Maandelijks')).toBe(true);
  });

  it('returns empty array when there are no recurring cashflows', () => {
    const cashFlows: CashFlow[] = [
      { id: '1', date: '2026-01-01', amount: 500, description: 'Eenmalig' },
    ];
    expect(getRecurringAutoEntries(cashFlows, '2026-12-31')).toEqual([]);
  });

  it('handles edited start date showing future occurrences', () => {
    // Scenario: user changes start from 2026-03-25 to 2026-02-25
    // The source entry (2026-02-25) is shown as a manual row,
    // so auto entries should show 2026-03-25, 2026-04-25, etc.
    const cashFlows: CashFlow[] = [{
      id: '1', date: '2026-02-25', amount: 100, description: 'Maandelijkse storting',
      recurring: { intervalMonths: 1 },
    }];
    const result = getRecurringAutoEntries(cashFlows, '2026-05-31');
    expect(result.map((e) => e.date)).toEqual([
      '2026-03-25', '2026-04-25', '2026-05-25',
    ]);
  });
});
