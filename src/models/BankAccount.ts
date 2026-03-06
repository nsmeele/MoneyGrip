import { PayoutInterval, getPeriodsPerYear } from '../enums/PayoutInterval';
import { InterestType } from '../enums/InterestType';
import { DayCountConvention } from '../enums/DayCountConvention';
import { type CashFlow, expandCashFlows } from './CashFlow';
import type { RateChange } from './RateChange';
import { addMonthsToISO, todayISO, isBeforeDate, getNextQuarterStart, getNextMonthStart, toMonthKey, daysBetween } from '../utils/date';
import { calculateDailyInterest } from '../utils/dailyInterest';

export interface PeriodResult {
  period: number;
  periodLabel: string;
  startBalance: number;
  interestEarned: number;
  disbursed: number;
  endBalance: number;
  deposited: number;
  endDate?: string;
}

export class BankAccount {
  public readonly id: string;
  public readonly timestamp: number;

  constructor(
    public readonly startAmount: number,
    public readonly annualInterestRate: number,
    public readonly durationMonths: number,
    public readonly interval: PayoutInterval,
    public readonly interestType: InterestType,
    public readonly startDate: string | undefined,
    public readonly periods: PeriodResult[],
    public readonly cashFlows: CashFlow[] = [],
    public readonly isOngoing: boolean = false,
    public readonly dayCount: DayCountConvention = DayCountConvention.NOM_12,
    public readonly rateChanges: RateChange[] = [],
    public readonly isVariableRate: boolean = false,
  ) {
    this.id = crypto.randomUUID();
    this.timestamp = Date.now();
  }

  get totalInterest(): number {
    return this.periods.reduce((sum, p) => sum + p.interestEarned, 0);
  }

  get endAmount(): number {
    if (this.periods.length === 0) return this.startAmount;
    const lastEndBalance = this.periods[this.periods.length - 1].endBalance;
    if (this.interestType === InterestType.Simple) {
      return lastEndBalance + this.totalInterest;
    }
    return lastEndBalance;
  }

  get totalDisbursed(): number {
    return this.periods.reduce((sum, p) => sum + p.disbursed, 0);
  }

  get disbursedToDate(): number {
    const today = todayISO();
    return this.periods
      .filter(p => p.endDate && !isBeforeDate(today, p.endDate))
      .reduce((sum, p) => sum + p.disbursed, 0);
  }

  get totalDeposited(): number {
    return this.periods.reduce((sum, p) => sum + (p.deposited ?? 0), 0);
  }

  get currentBalance(): number {
    if (this.cashFlows.length === 0) return this.startAmount;
    if (!this.startDate) {
      return this.startAmount + this.cashFlows.reduce((sum, cf) => sum + cf.amount, 0);
    }
    const endISO = addMonthsToISO(this.startDate, this.durationMonths);
    return this.startAmount + expandCashFlows(this.cashFlows, endISO).reduce((sum, cf) => sum + cf.amount, 0);
  }

  get endDate(): string | undefined {
    if (this.isOngoing || !this.startDate) return undefined;
    return addMonthsToISO(this.startDate, this.durationMonths);
  }

  get hasNotStartedYet(): boolean {
    if (!this.startDate) return false;
    return !isBeforeDate(this.startDate, todayISO());
  }

  get hasExpired(): boolean {
    if (this.isOngoing || !this.endDate) return false;
    return isBeforeDate(this.endDate, todayISO());
  }

  get nextPayoutDate(): string | undefined {
    if (!this.startDate || this.hasExpired) return undefined;

    if (this.hasNotStartedYet) {
      if (this.interval === PayoutInterval.AtMaturity) return this.endDate;
      if (this.interval === PayoutInterval.Monthly) return getNextMonthStart(this.startDate);
      if (this.interval === PayoutInterval.Quarterly) return getNextQuarterStart(this.startDate);
      const monthsPerPeriod = 12 / getPeriodsPerYear(this.interval);
      return addMonthsToISO(this.startDate, monthsPerPeriod);
    }
    if (this.interval === PayoutInterval.AtMaturity) return this.endDate;

    const today = todayISO();

    if (this.interval === PayoutInterval.Monthly) {
      const next = getNextMonthStart(today);
      if (this.endDate && !isBeforeDate(next, this.endDate)) return this.endDate;
      return next;
    }

    if (this.interval === PayoutInterval.Quarterly) {
      const next = getNextQuarterStart(today);
      if (this.endDate && !isBeforeDate(next, this.endDate)) return this.endDate;
      return next;
    }

    const monthsPerPeriod = 12 / getPeriodsPerYear(this.interval);
    let payoutDate = addMonthsToISO(this.startDate, monthsPerPeriod);
    while (isBeforeDate(payoutDate, today)) {
      payoutDate = addMonthsToISO(payoutDate, monthsPerPeriod);
    }
    if (this.endDate && !isBeforeDate(payoutDate, this.endDate)) return this.endDate;
    return payoutDate;
  }

  get accruedInterest(): number {
    if (this.periods.length === 0 || !this.startDate) return 0;

    const today = todayISO();
    let earned = 0;

    for (let i = 0; i < this.periods.length; i++) {
      const periodStart = i === 0 ? this.startDate : this.periods[i - 1].endDate;
      const periodEnd = this.periods[i].endDate;

      if (!periodStart || !periodEnd) continue;
      if (isBeforeDate(today, periodStart)) break;

      if (!isBeforeDate(today, periodEnd)) {
        earned += this.periods[i].interestEarned;
        continue;
      }

      // Today falls within this period — calculate partial interest (exclusive of today)
      const endISO = addMonthsToISO(this.startDate, this.durationMonths);
      const expanded = expandCashFlows(this.cashFlows, endISO)
        .filter(cf => cf.date >= periodStart && cf.date < today);

      const { interestEarned } = calculateDailyInterest(
        periodStart, today, this.periods[i].startBalance,
        expanded, this.annualInterestRate, this.dayCount, this.rateChanges,
      );
      earned += interestEarned;
      break;
    }

    return earned - this.disbursedToDate;
  }

  get label(): string {
    return `€${this.currentBalance.toLocaleString('nl-NL')} @ ${this.annualInterestRate}%`;
  }

  get calendarMonthProjection(): Map<string, number> {
    const map = new Map<string, number>();
    if (!this.startDate || this.periods.length === 0) return map;

    const endISO = this.endDate ?? addMonthsToISO(this.startDate, this.durationMonths);
    const allCashFlows = expandCashFlows(this.cashFlows, endISO);

    for (let i = 0; i < this.periods.length; i++) {
      const period = this.periods[i];
      const periodStart = i === 0 ? this.startDate : this.periods[i - 1].endDate!;
      const periodEnd = period.endDate;
      if (!periodEnd) continue;
      if (daysBetween(periodStart, periodEnd) <= 0) continue;

      // Calculate actual interest per month-slice
      const slices: { key: string; interest: number }[] = [];
      let sliceTotal = 0;
      let cursor = periodStart;

      while (cursor < periodEnd) {
        const nextMonth = getNextMonthStart(cursor);
        const sliceEnd = nextMonth < periodEnd ? nextMonth : periodEnd;

        const sliceCashFlows = allCashFlows.filter(cf => cf.date >= cursor && cf.date < sliceEnd);

        let startBalance = period.startBalance;
        for (const cf of allCashFlows) {
          if (cf.date >= periodStart && cf.date < cursor) {
            startBalance = Math.max(0, startBalance + Math.max(-startBalance, cf.amount));
          }
        }

        const { interestEarned } = calculateDailyInterest(
          cursor, sliceEnd, startBalance, sliceCashFlows,
          this.annualInterestRate, this.dayCount, this.rateChanges,
        );

        slices.push({ key: toMonthKey(cursor), interest: interestEarned });
        sliceTotal += interestEarned;
        cursor = sliceEnd;
      }

      // Scale slices so the period total is preserved
      const scale = sliceTotal > 0 ? period.interestEarned / sliceTotal : 0;
      for (const slice of slices) {
        map.set(slice.key, (map.get(slice.key) ?? 0) + slice.interest * scale);
      }
    }

    return map;
  }

  get calendarMonthDisbursement(): Map<string, number> {
    const map = new Map<string, number>();
    if (!this.startDate || this.periods.length === 0) return map;

    // Ensure all months in the projection range exist (with 0) for chart continuity
    for (const key of this.calendarMonthProjection.keys()) {
      map.set(key, 0);
    }

    for (const period of this.periods) {
      if (!period.endDate || period.disbursed <= 0) continue;
      const key = toMonthKey(period.endDate);
      map.set(key, (map.get(key) ?? 0) + period.disbursed);
    }

    return map;
  }

  get interestThisMonth(): number {
    if (this.periods.length === 0 || this.hasExpired || this.hasNotStartedYet) return 0;
    const key = toMonthKey(todayISO());
    return this.calendarMonthProjection.get(key) ?? 0;
  }
}
