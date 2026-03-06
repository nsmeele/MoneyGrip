import { describe, it, expect } from 'vitest';
import { interestPerMonth, buildPortfolioChartData } from '../utils/interest';
import { BankAccount } from '../models/BankAccount';
import { PayoutInterval } from '../enums/PayoutInterval';
import { InterestType } from '../enums/InterestType';
import type { PeriodResult } from '../models/BankAccount';

function makeResult(overrides: {
  startAmount?: number;
  annualInterestRate?: number;
  durationMonths?: number;
  interval?: PayoutInterval;
  startDate?: string;
  periods?: PeriodResult[];
} = {}): BankAccount {
  const durationMonths = overrides.durationMonths ?? 12;
  const periods = overrides.periods ?? Array.from({ length: durationMonths }, (_, i) => ({
    period: i + 1,
    periodLabel: `Periode ${i + 1}`,
    startBalance: 10000,
    interestEarned: 50,
    disbursed: 50,
    endBalance: 10000,
    deposited: 0,
  }));

  return new BankAccount(
    overrides.startAmount ?? 10000,
    overrides.annualInterestRate ?? 6,
    durationMonths,
    overrides.interval ?? PayoutInterval.Monthly,
    InterestType.Simple,
    overrides.startDate,
    periods,
  );
}

describe('interestPerMonth', () => {
  it('returns totalInterest / durationMonths', () => {
    const result = makeResult();
    expect(interestPerMonth(result)).toBeCloseTo(600 / 12, 2);
  });

  it('returns 0 for 0 duration', () => {
    const result = makeResult({ durationMonths: 0, periods: [] });
    expect(interestPerMonth(result)).toBe(0);
  });
});

describe('buildPortfolioChartData', () => {
  it('returns empty for items without startDate', () => {
    const result = makeResult({ startDate: undefined });
    expect(buildPortfolioChartData([result])).toEqual([]);
  });

  it('returns one data point per month for a monthly result', () => {
    const result = makeResult({ startDate: '2025-01-01', durationMonths: 6, periods: Array.from({ length: 6 }, (_, i) => ({
      period: i + 1,
      periodLabel: `Periode ${i + 1}`,
      startBalance: 10000,
      interestEarned: 50,
      disbursed: 50,
      endBalance: 10000,
      deposited: 0,
    })) });
    const data = buildPortfolioChartData([result]);
    expect(data).toHaveLength(6);
    expect(data[0].monthKey).toBe('2025-01');
    expect(data[5].monthKey).toBe('2025-06');
  });

  it('combines multiple items on the same months', () => {
    const a = makeResult({ startDate: '2025-01-01', durationMonths: 3, periods: Array.from({ length: 3 }, (_, i) => ({
      period: i + 1, periodLabel: '', startBalance: 10000, interestEarned: 100, disbursed: 100, endBalance: 10000, deposited: 0,
    })) });
    const b = makeResult({ startDate: '2025-01-01', durationMonths: 3, periods: Array.from({ length: 3 }, (_, i) => ({
      period: i + 1, periodLabel: '', startBalance: 5000, interestEarned: 25, disbursed: 25, endBalance: 5000, deposited: 0,
    })) });
    const data = buildPortfolioChartData([a, b]);
    expect(data).toHaveLength(3);
    expect(data[0].interest).toBeCloseTo(125, 2);
  });

  it('fills gaps between non-overlapping items', () => {
    const a = makeResult({ startDate: '2025-01-01', durationMonths: 2, periods: Array.from({ length: 2 }, (_, i) => ({
      period: i + 1, periodLabel: '', startBalance: 10000, interestEarned: 50, disbursed: 50, endBalance: 10000, deposited: 0,
    })) });
    const b = makeResult({ startDate: '2025-05-01', durationMonths: 2, periods: Array.from({ length: 2 }, (_, i) => ({
      period: i + 1, periodLabel: '', startBalance: 10000, interestEarned: 50, disbursed: 50, endBalance: 10000, deposited: 0,
    })) });
    const data = buildPortfolioChartData([a, b]);
    expect(data).toHaveLength(6);
    expect(data[2].interest).toBe(0); // March gap
    expect(data[3].interest).toBe(0); // April gap
  });

  it('labels use Dutch month abbreviations', () => {
    const result = makeResult({ startDate: '2025-01-01', durationMonths: 1, periods: [{
      period: 1, periodLabel: '', startBalance: 10000, interestEarned: 50, disbursed: 50, endBalance: 10000, deposited: 0,
    }] });
    const data = buildPortfolioChartData([result]);
    expect(data[0].label).toContain("'25");
  });
});
