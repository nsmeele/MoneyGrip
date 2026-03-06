import { describe, it, expect } from 'vitest';
import { CompoundInterestStrategy } from '../strategies/CompoundInterestStrategy';
import { BankAccountInput } from '../models/BankAccountInput';
import { PayoutInterval } from '../enums/PayoutInterval';
import { InterestType } from '../enums/InterestType';

const strategy = new CompoundInterestStrategy();

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
    InterestType.Compound,
  );
}

describe('CompoundInterestStrategy', () => {
  it('produces 12 periods for monthly over 1 year', () => {
    const result = strategy.calculate(makeInput());
    expect(result).toHaveLength(12);
  });

  it('compounds interest correctly', () => {
    const result = strategy.calculate(makeInput());
    expect(result[0].startBalance).toBe(10000);
    expect(result[0].interestEarned).toBeCloseTo(10000 * 0.05 / 12, 2);
    expect(result[1].startBalance).toBeCloseTo(result[0].endBalance, 2);
  });

  it('total interest matches compound formula', () => {
    const result = strategy.calculate(makeInput());
    const totalInterest = result.reduce((sum, p) => sum + p.interestEarned, 0);
    const expected = 10000 * (Math.pow(1 + 0.05 / 12, 12) - 1);
    expect(totalInterest).toBeCloseTo(expected, 2);
  });

  it('produces single period for AtMaturity without adjustments', () => {
    const result = strategy.calculate(makeInput({ interval: PayoutInterval.AtMaturity }));
    expect(result).toHaveLength(1);
    expect(result[0].periodLabel).toBe('Einde looptijd');
  });

  it('produces 4 periods for quarterly over 1 year', () => {
    const result = strategy.calculate(makeInput({ interval: PayoutInterval.Quarterly }));
    expect(result).toHaveLength(4);
  });

  it('applies positive balance adjustment (deposit)', () => {
    const result = strategy.calculate(makeInput(), { 3: 5000 });
    expect(result[2].deposited).toBe(5000);
    expect(result[2].startBalance).toBeCloseTo(result[1].endBalance + 5000, 2);
  });

  it('applies negative balance adjustment (withdrawal)', () => {
    const result = strategy.calculate(makeInput(), { 2: -3000 });
    expect(result[1].deposited).toBe(-3000);
    expect(result[1].startBalance).toBeCloseTo(result[0].endBalance - 3000, 2);
  });

  it('clamps withdrawal to prevent negative balance', () => {
    const result = strategy.calculate(makeInput({ startAmount: 1000 }), { 1: -5000 });
    expect(result[0].deposited).toBe(-1000);
    expect(result[0].startBalance).toBe(0);
    expect(result[0].interestEarned).toBe(0);
  });

  it('switches AtMaturity to monthly periods when adjustments exist', () => {
    const result = strategy.calculate(
      makeInput({ interval: PayoutInterval.AtMaturity }),
      { 3: 1000 },
    );
    expect(result).toHaveLength(12);
    expect(result[2].deposited).toBe(1000);
  });

  it('all periods have deposited field', () => {
    const result = strategy.calculate(makeInput());
    for (const p of result) {
      expect(p).toHaveProperty('deposited');
      expect(p.deposited).toBe(0);
    }
  });
});
