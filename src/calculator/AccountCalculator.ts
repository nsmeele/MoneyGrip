import type { IAccountCalculator } from '../interfaces/IAccountCalculator';
import type { BankAccountInput } from '../models/BankAccountInput';
import type { BalanceAdjustments, PeriodScheduleEntry } from '../interfaces/IInterestStrategy';
import { BankAccount } from '../models/BankAccount';
import { InterestStrategyFactory } from '../factories/InterestStrategyFactory';
import { PayoutInterval, getPeriodsPerYear } from '../enums/PayoutInterval';
import { expandCashFlows } from '../models/CashFlow';
import { addMonthsToISO, monthsBetween, getNextQuarterStart, getNextMonthStart, isBeforeDate } from '../utils/date';

export class AccountCalculator implements IAccountCalculator {
  calculate(input: BankAccountInput): BankAccount {
    const strategy = InterestStrategyFactory.create(input.interestType);
    const schedule = this.buildSchedule(input);
    const adjustments = this.buildAdjustments(input, schedule);
    const periods = strategy.calculate(input, adjustments, schedule);

    return new BankAccount(
      input.startAmount,
      input.annualInterestRate,
      input.durationMonths,
      input.interval,
      input.interestType,
      input.startDate,
      periods,
      input.cashFlows,
      input.isOngoing,
    );
  }

  private buildSchedule(input: BankAccountInput): PeriodScheduleEntry[] | undefined {
    const getNextBoundary = this.getNextBoundaryFn(input.interval);
    if (!input.startDate || !getNextBoundary) return undefined;

    const endISO = addMonthsToISO(input.startDate, input.durationMonths);
    const schedule: PeriodScheduleEntry[] = [];
    let periodStart = input.startDate;

    while (isBeforeDate(periodStart, endISO)) {
      const nextBoundary = getNextBoundary(periodStart);
      const periodEnd = isBeforeDate(nextBoundary, endISO) ? nextBoundary : endISO;

      if (periodStart === periodEnd) break;

      schedule.push({
        label: `Periode ${schedule.length + 1}`,
        startDate: periodStart,
        endDate: periodEnd,
      });

      periodStart = periodEnd;
    }

    return schedule;
  }

  private getNextBoundaryFn(interval: PayoutInterval): ((iso: string) => string) | undefined {
    switch (interval) {
      case PayoutInterval.Monthly: return getNextMonthStart;
      case PayoutInterval.Quarterly: return getNextQuarterStart;
      default: return undefined;
    }
  }

  private buildAdjustments(input: BankAccountInput, schedule?: PeriodScheduleEntry[]): BalanceAdjustments {
    if (input.cashFlows.length === 0 || !input.startDate) return {};

    const endISO = addMonthsToISO(input.startDate, input.durationMonths);
    const expanded = expandCashFlows(input.cashFlows, endISO);
    const hasCashFlows = expanded.length > 0;

    if (schedule) {
      return this.mapCashFlowsToSchedule(expanded, schedule);
    }

    const periodsPerYear = (input.interval === PayoutInterval.AtMaturity && hasCashFlows) ? 12 : getPeriodsPerYear(input.interval);
    const monthsPerPeriod = 12 / periodsPerYear;

    const adjustments: BalanceAdjustments = {};

    for (const cf of expanded) {
      const monthOffset = monthsBetween(input.startDate, cf.date);

      if (monthOffset < 0 || monthOffset >= input.durationMonths) continue;

      const periodIndex = Math.floor(monthOffset / monthsPerPeriod) + 1;
      adjustments[periodIndex] = (adjustments[periodIndex] ?? 0) + cf.amount;
    }

    return adjustments;
  }

  private mapCashFlowsToSchedule(
    expanded: { date: string; amount: number }[],
    schedule: PeriodScheduleEntry[],
  ): BalanceAdjustments {
    const adjustments: BalanceAdjustments = {};

    for (const cf of expanded) {
      for (let i = 0; i < schedule.length; i++) {
        const { startDate, endDate } = schedule[i];
        const isInPeriod = cf.date >= startDate && cf.date < endDate;

        if (isInPeriod) {
          const periodIndex = i + 1;
          adjustments[periodIndex] = (adjustments[periodIndex] ?? 0) + cf.amount;
          break;
        }
      }
    }

    return adjustments;
  }
}
