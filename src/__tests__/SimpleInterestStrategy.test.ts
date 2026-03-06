import { describe, it, expect } from 'vitest';
import { SimpleInterestStrategy } from '../strategies/SimpleInterestStrategy';
import { BankAccountInput } from '../models/BankAccountInput';
import { PayoutInterval } from '../enums/PayoutInterval';
import { InterestType } from '../enums/InterestType';

const strategy = new SimpleInterestStrategy();

function makeInput(overrides: {
  startAmount?: number;
  annualInterestRate?: number;
  durationMonths?: number;
  interval?: PayoutInterval;
} = {}) {
  return new BankAccountInput(
    overrides.startAmount ?? 10000,
    overrides.annualInterestRate ?? 5,
    overrides.durationMonths ?? 12,
    overrides.interval ?? PayoutInterval.Monthly,
    InterestType.Simple,
  );
}

describe('SimpleInterestStrategy', () => {
  it('produces 12 periods for monthly over 1 year', () => {
    const result = strategy.calculate(makeInput());
    expect(result).toHaveLength(12);
  });

  it('interest is constant each period (no compounding)', () => {
    const result = strategy.calculate(makeInput());
    const monthlyInterest = 10000 * 0.05 / 12;
    for (const p of result) {
      expect(p.interestEarned).toBeCloseTo(monthlyInterest, 2);
    }
  });

  it('endBalance equals startBalance (simple interest disbursed)', () => {
    const result = strategy.calculate(makeInput());
    for (const p of result) {
      expect(p.endBalance).toBe(p.startBalance);
    }
  });

  it('total interest matches simple formula', () => {
    const result = strategy.calculate(makeInput());
    const totalInterest = result.reduce((sum, p) => sum + p.interestEarned, 0);
    const expected = 10000 * 0.05;
    expect(totalInterest).toBeCloseTo(expected, 2);
  });

  it('produces single period for AtMaturity without adjustments', () => {
    const result = strategy.calculate(makeInput({ interval: PayoutInterval.AtMaturity }));
    expect(result).toHaveLength(1);
    expect(result[0].interestEarned).toBeCloseTo(10000 * 0.05, 2);
  });

  it('adjusts principal on deposit', () => {
    const result = strategy.calculate(makeInput(), { 3: 5000 });
    expect(result[2].deposited).toBe(5000);
    expect(result[2].startBalance).toBe(15000);
    expect(result[2].interestEarned).toBeCloseTo(15000 * 0.05 / 12, 2);
  });

  it('adjusts principal on withdrawal', () => {
    const result = strategy.calculate(makeInput(), { 2: -4000 });
    expect(result[1].deposited).toBe(-4000);
    expect(result[1].startBalance).toBe(6000);
    expect(result[1].interestEarned).toBeCloseTo(6000 * 0.05 / 12, 2);
  });

  it('clamps withdrawal to prevent negative balance', () => {
    const result = strategy.calculate(makeInput({ startAmount: 1000 }), { 1: -5000 });
    expect(result[0].deposited).toBe(-1000);
    expect(result[0].startBalance).toBe(0);
    expect(result[0].interestEarned).toBe(0);
  });
});
