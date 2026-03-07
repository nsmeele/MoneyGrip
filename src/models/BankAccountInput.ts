import { PayoutInterval } from '../enums/PayoutInterval';
import { CURRENCY_SYMBOLS, type Currency } from '../enums/Currency';
import { InterestType } from '../enums/InterestType';
import { DayCountConvention } from '../enums/DayCountConvention';
import type { CashFlow } from './CashFlow';
import type { RateChange } from './RateChange';

export class BankAccountInput {
  constructor(
    public readonly startAmount: number,
    public readonly annualInterestRate: number,
    public readonly durationMonths: number,
    public readonly interval: PayoutInterval,
    public readonly interestType: InterestType,
    public readonly startDate?: string,
    public readonly cashFlows: CashFlow[] = [],
    public readonly isOngoing: boolean = false,
    public readonly dayCount: DayCountConvention = DayCountConvention.NOM_12,
    public readonly rateChanges: RateChange[] = [],
    public readonly isVariableRate: boolean = false,
    public readonly currency?: string,
  ) {}

  get durationYears(): number {
    return this.durationMonths / 12;
  }

  get label(): string {
    const symbol = this.currency ? (CURRENCY_SYMBOLS[this.currency as Currency] ?? this.currency) : '\u20AC';
    return `${symbol}${this.startAmount.toLocaleString('nl-NL')} @ ${this.annualInterestRate}%`;
  }
}
