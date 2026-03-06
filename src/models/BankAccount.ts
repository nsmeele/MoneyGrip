import { PayoutInterval, getPeriodsPerYear } from '../enums/PayoutInterval';
import { InterestType } from '../enums/InterestType';
import { type CashFlow, expandCashFlows } from './CashFlow';
import { addMonthsToISO, todayISO, isBeforeDate, getNextQuarterStart, getNextMonthStart } from '../utils/date';

export interface PeriodResult {
  period: number;
  periodLabel: string;
  startBalance: number;
  interestEarned: number;
  disbursed: number;
  endBalance: number;
  deposited: number;
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
  ) {
    this.id = crypto.randomUUID();
    this.timestamp = Date.now();
  }

  get totalInterest(): number {
    return this.periods.reduce((sum, p) => sum + p.interestEarned, 0);
  }

  get endAmount(): number {
    if (this.periods.length === 0) return this.startAmount;
    return this.periods[this.periods.length - 1].endBalance;
  }

  get totalDisbursed(): number {
    return this.periods.reduce((sum, p) => sum + p.disbursed, 0);
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
    if (!this.startDate || this.hasExpired || this.hasNotStartedYet) return undefined;
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

  get label(): string {
    return `€${this.startAmount.toLocaleString('nl-NL')} @ ${this.annualInterestRate}%`;
  }
}
