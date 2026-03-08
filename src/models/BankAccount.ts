import { PayoutInterval } from '../enums/PayoutInterval';

import { InterestType } from '../enums/InterestType';
import { DayCountConvention } from '../enums/DayCountConvention';
import type { AccountType } from '../enums/AccountType';
import type { NoticePeriodUnit } from '../enums/NoticePeriodUnit';
import { type CashFlow, expandCashFlows } from './CashFlow';
import type { RateChange } from './RateChange';
import { addMonthsToISO, todayISO, isBeforeDate, addDayISO, getNextMonthStart, getNextBoundaryStart, INTERVAL_BOUNDARIES, toMonthKey, daysBetween } from '../utils/date';
import { calculateDailyInterest } from '../utils/dailyInterest';
import { applyWithdrawal } from '../utils/applyWithdrawal';


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
    public readonly currency?: string,
    public readonly accountType?: AccountType,
    public readonly hasCashFlows: boolean = true,
    public readonly noticePeriodValue?: number,
    public readonly noticePeriodUnit?: NoticePeriodUnit,
    public readonly processingDays?: number,
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

  get effectiveBalance(): number {
    return this.interestType === InterestType.Compound
      ? this.currentBalance + this.disbursedToDate
      : this.currentBalance;
  }

  get currentBalance(): number {
    if (this.cashFlows.length === 0) return this.startAmount;
    if (!this.startDate) {
      return this.startAmount + this.cashFlows.reduce((sum, cf) => sum + cf.amount, 0);
    }
    const endISO = addMonthsToISO(this.startDate, this.durationMonths);
    const today = todayISO();
    const cutoff = endISO < today ? endISO : today;
    return this.startAmount + expandCashFlows(this.cashFlows, endISO)
      .filter((cf) => cf.date <= cutoff)
      .reduce((sum, cf) => sum + cf.amount, 0);
  }

  get endDate(): string | undefined {
    if (this.isOngoing || !this.startDate) return undefined;
    return addMonthsToISO(this.startDate, this.durationMonths);
  }

  get currentRate(): number {
    if (this.rateChanges.length === 0) return this.annualInterestRate;
    const today = todayISO();
    let rate = this.annualInterestRate;
    for (const rc of [...this.rateChanges].sort((a, b) => a.date.localeCompare(b.date))) {
      if (isBeforeDate(rc.date, today) || rc.date === today) {
        rate = rc.annualInterestRate;
      }
    }
    return rate;
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
    if (this.interval === PayoutInterval.AtMaturity) return this.endDate;
    if (this.interval === PayoutInterval.Daily) {
      const next = addDayISO(this.hasNotStartedYet ? this.startDate : todayISO());
      if (this.endDate && !isBeforeDate(next, this.endDate)) return this.endDate;
      return next;
    }

    const boundaries = INTERVAL_BOUNDARIES[this.interval];
    if (!boundaries) return undefined;

    const ref = this.hasNotStartedYet ? this.startDate : todayISO();
    const next = getNextBoundaryStart(ref, boundaries);

    if (this.endDate && !isBeforeDate(next, this.endDate)) return this.endDate;
    return next;
  }

  get nextPayoutAmount(): number | undefined {
    const nextDate = this.nextPayoutDate;
    if (!nextDate) return undefined;
    return this.calendarMonthDisbursement.get(toMonthKey(nextDate));
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
            const { newBalance } = applyWithdrawal(startBalance, cf.amount);
            startBalance = newBalance;
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
    if (this.periods.length === 0 || this.hasExpired) return 0;
    const today = todayISO();
    if (this.startDate && !isBeforeDate(this.startDate, getNextMonthStart(today))) return 0;
    const key = toMonthKey(today);
    return this.calendarMonthProjection.get(key) ?? 0;
  }
}
