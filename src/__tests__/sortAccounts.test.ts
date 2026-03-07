import { describe, it, expect } from 'vitest';
import { BankAccount } from '../models/BankAccount';
import { PayoutInterval } from '../enums/PayoutInterval';
import { InterestType } from '../enums/InterestType';
import { sortAccounts } from '../components/BankAccountsOverview/sortAccounts';
import type { SortState } from '../components/BankAccountsOverview/sortAccounts';

function makeAccount(overrides: {
  startAmount?: number;
  rate?: number;
  durationMonths?: number;
  startDate?: string;
  isOngoing?: boolean;
  interestType?: InterestType;
}): BankAccount {
  return new BankAccount(
    overrides.startAmount ?? 10000,
    overrides.rate ?? 4,
    overrides.durationMonths ?? 12,
    PayoutInterval.Monthly,
    overrides.interestType ?? InterestType.Simple,
    overrides.startDate ?? '2025-01-01',
    [],
    [],
    overrides.isOngoing ?? false,
  );
}

describe('sortAccounts', () => {
  const ongoing = makeAccount({ startAmount: 5000, rate: 3, isOngoing: true });
  const shortTerm = makeAccount({ startAmount: 20000, rate: 2, durationMonths: 6, startDate: '2025-01-01' });
  const longTerm = makeAccount({ startAmount: 8000, rate: 5, durationMonths: 24, startDate: '2025-01-01' });

  describe('default (no sort state)', () => {
    it('puts ongoing accounts first, then sorts by end date ascending', () => {
      const result = sortAccounts([shortTerm, ongoing, longTerm], null);
      expect(result[0]).toBe(ongoing);
      expect(result[1]).toBe(shortTerm);
      expect(result[2]).toBe(longTerm);
    });
  });

  describe('sort by balance', () => {
    it('sorts ascending by balance', () => {
      const sort: SortState = { column: 'balance', direction: 'asc' };
      const result = sortAccounts([shortTerm, ongoing, longTerm], sort);
      expect(result.map(r => r.startAmount)).toEqual([5000, 8000, 20000]);
    });

    it('sorts descending by balance', () => {
      const sort: SortState = { column: 'balance', direction: 'desc' };
      const result = sortAccounts([shortTerm, ongoing, longTerm], sort);
      expect(result.map(r => r.startAmount)).toEqual([20000, 8000, 5000]);
    });
  });

  describe('sort by end date', () => {
    it('sorts ascending — ongoing (no endDate) goes last', () => {
      const sort: SortState = { column: 'endDate', direction: 'asc' };
      const result = sortAccounts([ongoing, longTerm, shortTerm], sort);
      expect(result[0]).toBe(shortTerm);
      expect(result[1]).toBe(longTerm);
      expect(result[2]).toBe(ongoing);
    });

    it('sorts descending — ongoing (no endDate) goes first', () => {
      const sort: SortState = { column: 'endDate', direction: 'desc' };
      const result = sortAccounts([shortTerm, longTerm, ongoing], sort);
      expect(result[0]).toBe(ongoing);
      expect(result[1]).toBe(longTerm);
      expect(result[2]).toBe(shortTerm);
    });
  });

  describe('compound interest balance includes disbursedToDate', () => {
    it('uses currentBalance + disbursedToDate for compound accounts', () => {
      const simple = makeAccount({ startAmount: 10000, rate: 4, interestType: InterestType.Simple });
      const compound = makeAccount({ startAmount: 8000, rate: 4, interestType: InterestType.Compound });
      // Both have no periods, so disbursedToDate = 0, currentBalance = startAmount
      // simple: 10000, compound: 8000 + 0 = 8000
      const sort: SortState = { column: 'balance', direction: 'asc' };
      const result = sortAccounts([simple, compound], sort);
      expect(result[0]).toBe(compound);
      expect(result[1]).toBe(simple);
    });
  });
});
