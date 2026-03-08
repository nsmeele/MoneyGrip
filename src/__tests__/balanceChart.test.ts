import { describe, it, expect } from 'vitest';
import { buildBalanceData, formatPeriodLabel } from '../utils/balanceChart';
import { BankAccount } from '../models/BankAccount';
import { PayoutInterval } from '../enums/PayoutInterval';
import { InterestType } from '../enums/InterestType';
import type { PeriodResult } from '../models/BankAccount';

function makePeriods(
  entries: { endDate: string; endBalance?: number; interestEarned?: number; disbursed?: number }[],
): PeriodResult[] {
  return entries.map((e, i) => ({
    period: i + 1,
    periodLabel: `Periode ${i + 1}`,
    startBalance: 10000,
    interestEarned: e.interestEarned ?? 50,
    disbursed: e.disbursed ?? 0,
    endBalance: e.endBalance ?? 10000,
    deposited: 0,
    endDate: e.endDate,
  }));
}

function makeAccount(
  periods: PeriodResult[],
  overrides: {
    startDate?: string | null;
    isOngoing?: boolean;
    interestType?: InterestType;
  } = {},
): BankAccount {
  return new BankAccount(
    10000, 6, periods.length,
    PayoutInterval.Monthly,
    overrides.interestType ?? InterestType.Compound,
    overrides.startDate === null ? undefined : (overrides.startDate ?? '2026-01-01'),
    periods,
    [], overrides.isOngoing ?? false,
  );
}

describe('buildBalanceData', () => {
  it('returns empty array when account has no startDate', () => {
    const account = makeAccount(
      makePeriods([{ endDate: '2026-02-01' }]),
      { startDate: null },
    );
    expect(buildBalanceData(account, 2026, 2026)).toEqual([]);
  });

  it('returns empty array when account has no periods', () => {
    const account = makeAccount([]);
    expect(buildBalanceData(account, 2026, 2026)).toEqual([]);
  });

  it('produces 12 data points for a 1-year range', () => {
    const periods = makePeriods([
      { endDate: '2026-03-01' },
      { endDate: '2026-06-01' },
      { endDate: '2026-09-01' },
      { endDate: '2026-12-01' },
    ]);
    const account = makeAccount(periods);
    const data = buildBalanceData(account, 2026, 2026);
    expect(data).toHaveLength(12);
    expect(data[0].label).toBe(formatPeriodLabel('2026-01-01'));
    expect(data[11].label).toBe(formatPeriodLabel('2026-12-01'));
  });

  it('produces 24 data points for a 2-year range', () => {
    const periods = makePeriods([
      { endDate: '2026-06-01' },
      { endDate: '2026-12-01' },
      { endDate: '2027-06-01' },
      { endDate: '2027-12-01' },
    ]);
    const account = makeAccount(periods);
    const data = buildBalanceData(account, 2026, 2027);
    expect(data).toHaveLength(24);
  });

  it('shows null balance for months before account start', () => {
    const periods = makePeriods([
      { endDate: '2026-09-01' },
      { endDate: '2026-12-01' },
    ]);
    const account = makeAccount(periods, { startDate: '2026-06-15' });
    const data = buildBalanceData(account, 2026, 2026);
    expect(data).toHaveLength(12);
    // Jan–May: before account start → null
    for (let i = 0; i < 5; i++) {
      expect(data[i].balance).toBeNull();
    }
    // June: account start month → startAmount
    expect(data[5].balance).toBe(10000);
  });

  it('shows opening balance when account started before range', () => {
    const periods = makePeriods([
      { endDate: '2025-06-01', endBalance: 10500 },
      { endDate: '2025-12-01', endBalance: 11000 },
      { endDate: '2026-06-01', endBalance: 11500 },
    ]);
    const account = makeAccount(periods, { startDate: '2025-01-01' });
    const data = buildBalanceData(account, 2026, 2026);
    expect(data[0].label).toBe(formatPeriodLabel('2026-01-01'));
    // Opening balance = endBalance of last period before range (2025-12-01)
    expect(data[0].balance).toBe(11000);
  });

  it('uses endBalance + cumulative disbursed for simple interest', () => {
    const periods = makePeriods([
      { endDate: '2026-02-01', endBalance: 10000, disbursed: 100 },
      { endDate: '2026-03-01', endBalance: 10000, disbursed: 100 },
    ]);
    const account = makeAccount(periods, { interestType: InterestType.Simple });
    const data = buildBalanceData(account, 2026, 2026);
    // Jan: start month = startAmount
    expect(data[0].balance).toBe(10000);
    // Feb: endBalance + cumulative disbursed (100)
    expect(data[1].balance).toBe(10100);
    // Mar: endBalance + cumulative disbursed (200)
    expect(data[2].balance).toBe(10200);
  });

  it('does not add cumulative disbursed for compound interest', () => {
    const periods = makePeriods([
      { endDate: '2026-02-01', endBalance: 10100, disbursed: 100 },
      { endDate: '2026-03-01', endBalance: 10200, disbursed: 100 },
    ]);
    const account = makeAccount(periods, { interestType: InterestType.Compound });
    const data = buildBalanceData(account, 2026, 2026);
    // Compound: just endBalance, no cumulative disbursed
    expect(data[1].balance).toBe(10100);
    expect(data[2].balance).toBe(10200);
  });

  it('carries forward last known balance for months without period data', () => {
    const periods = makePeriods([
      { endDate: '2026-03-01', endBalance: 10500 },
    ]);
    const account = makeAccount(periods, { isOngoing: true });
    const data = buildBalanceData(account, 2026, 2026);
    // Mar: period data
    expect(data[2].balance).toBe(10500);
    // Apr–Dec: carry forward
    for (let i = 3; i < 12; i++) {
      expect(data[i].balance).toBe(10500);
    }
  });

  it('stops line after account end for non-ongoing accounts', () => {
    const periods = makePeriods([
      { endDate: '2026-03-01', endBalance: 10500 },
    ]);
    const account = makeAccount(periods, { isOngoing: false });
    const data = buildBalanceData(account, 2026, 2026);
    // Mar: last period month
    expect(data[2].balance).toBe(10500);
    // Apr onwards: null (account ended)
    for (let i = 3; i < 12; i++) {
      expect(data[i].balance).toBeNull();
    }
  });

  it('ongoing account continues line past last period', () => {
    const periods = makePeriods([
      { endDate: '2026-03-01', endBalance: 10500 },
    ]);
    const account = makeAccount(periods, { isOngoing: true });
    const data = buildBalanceData(account, 2026, 2026);
    // All months after Mar still have balance
    expect(data[11].balance).toBe(10500);
  });
});

describe('buildBalanceData start and end dates', () => {
  it('starts at account startDate when within range', () => {
    const periods = makePeriods([
      { endDate: '2026-04-01' },
      { endDate: '2026-07-01' },
    ]);
    const account = makeAccount(periods, { startDate: '2026-01-01' });
    const data = buildBalanceData(account, 2026, 2026);
    expect(data[0].label).toBe(formatPeriodLabel('2026-01-01'));
    expect(data[0].balance).toBe(10000);
  });

  it('null balance before mid-year account start', () => {
    const periods = makePeriods([
      { endDate: '2026-09-01' },
      { endDate: '2026-12-01' },
    ]);
    const account = makeAccount(periods, { startDate: '2026-06-15' });
    const data = buildBalanceData(account, 2026, 2026);
    expect(data).toHaveLength(12);
    expect(data[0].label).toBe(formatPeriodLabel('2026-01-01'));
    expect(data[0].balance).toBeNull();
    // June (index 5) is account start month
    expect(data[5].balance).toBe(10000);
  });

  it('starts at range start when account started before range', () => {
    const periods = makePeriods([
      { endDate: '2025-06-01', endBalance: 10500 },
      { endDate: '2025-12-01', endBalance: 11000 },
      { endDate: '2026-06-01', endBalance: 11500 },
    ]);
    const account = makeAccount(periods, { startDate: '2025-01-01' });
    const data = buildBalanceData(account, 2026, 2026);
    expect(data[0].label).toBe(formatPeriodLabel('2026-01-01'));
  });

  it('last data point is Dec of end year', () => {
    const periods = makePeriods([
      { endDate: '2026-06-01' },
      { endDate: '2026-12-01' },
      { endDate: '2027-06-01' },
    ]);
    const account = makeAccount(periods, { isOngoing: true });
    const data = buildBalanceData(account, 2026, 2026);
    expect(data[data.length - 1].label).toBe(formatPeriodLabel('2026-12-01'));
  });

  it('extending range from 1J to 3J produces more data points', () => {
    const periods = makePeriods([
      { endDate: '2026-06-01' },
      { endDate: '2026-12-01' },
      { endDate: '2027-06-01' },
      { endDate: '2027-12-01' },
      { endDate: '2028-06-01' },
      { endDate: '2028-12-01' },
    ]);
    const account = makeAccount(periods, { isOngoing: true });
    const data1J = buildBalanceData(account, 2026, 2026);
    const data3J = buildBalanceData(account, 2026, 2028);
    expect(data1J).toHaveLength(12);
    expect(data3J).toHaveLength(36);
  });
});
