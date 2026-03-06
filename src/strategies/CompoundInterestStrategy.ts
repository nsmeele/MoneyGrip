import type { IInterestStrategy, BalanceAdjustments, PeriodScheduleEntry } from '../interfaces/IInterestStrategy';
import type { BankAccountInput } from '../models/BankAccountInput';
import type { PeriodResult } from '../models/BankAccount';
import { PayoutInterval, getPeriodsPerYear } from '../enums/PayoutInterval';

export class CompoundInterestStrategy implements IInterestStrategy {
  calculate(input: BankAccountInput, adjustments: BalanceAdjustments = {}, schedule?: PeriodScheduleEntry[]): PeriodResult[] {
    if (input.interval === PayoutInterval.AtMaturity && !hasAdjustments(adjustments)) {
      const durationYears = input.durationMonths / 12;
      const interestEarned = input.startAmount * (Math.pow(1 + input.annualInterestRate / 100, durationYears) - 1);

      return [{
        period: 1,
        periodLabel: 'Einde looptijd',
        startBalance: input.startAmount,
        interestEarned,
        disbursed: interestEarned,
        endBalance: input.startAmount + interestEarned,
        deposited: 0,
      }];
    }

    if (schedule) {
      return this.calculateWithSchedule(input, adjustments, schedule);
    }

    const periodsPerYear = input.interval === PayoutInterval.AtMaturity ? 12 : getPeriodsPerYear(input.interval);
    const interestFraction = input.annualInterestRate / 100 / periodsPerYear;
    const totalPeriods = Math.floor(input.durationMonths / 12 * periodsPerYear);
    const periods: PeriodResult[] = [];

    let currentBalance = input.startAmount;

    for (let i = 1; i <= totalPeriods; i++) {
      const adjustment = adjustments[i] ?? 0;
      const deposited = Math.max(-currentBalance, adjustment);
      currentBalance = Math.max(0, currentBalance + deposited);

      const interestEarned = currentBalance * interestFraction;
      const newBalance = currentBalance + interestEarned;

      periods.push({
        period: i,
        periodLabel: `Periode ${i}`,
        startBalance: currentBalance,
        interestEarned,
        disbursed: interestEarned,
        endBalance: newBalance,
        deposited,
      });

      currentBalance = newBalance;
    }

    return periods;
  }

  private calculateWithSchedule(input: BankAccountInput, adjustments: BalanceAdjustments, schedule: PeriodScheduleEntry[]): PeriodResult[] {
    const periodsPerYear = getPeriodsPerYear(input.interval);
    const interestFraction = input.annualInterestRate / 100 / periodsPerYear;
    const periods: PeriodResult[] = [];
    let currentBalance = input.startAmount;

    for (let i = 0; i < schedule.length; i++) {
      const entry = schedule[i];
      const periodIndex = i + 1;

      const adjustment = adjustments[periodIndex] ?? 0;
      const deposited = Math.max(-currentBalance, adjustment);
      currentBalance = Math.max(0, currentBalance + deposited);

      const interestEarned = currentBalance * interestFraction;
      const newBalance = currentBalance + interestEarned;

      periods.push({
        period: periodIndex,
        periodLabel: entry.label,
        startBalance: currentBalance,
        interestEarned,
        disbursed: interestEarned,
        endBalance: newBalance,
        deposited,
      });

      currentBalance = newBalance;
    }

    return periods;
  }
}

function hasAdjustments(adj: BalanceAdjustments): boolean {
  return Object.keys(adj).length > 0;
}
