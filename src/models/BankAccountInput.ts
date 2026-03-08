import { PayoutInterval } from '../enums/PayoutInterval';
import { InterestType } from '../enums/InterestType';
import { DayCountConvention } from '../enums/DayCountConvention';
import type { AccountType } from '../enums/AccountType';
import type { NoticePeriodUnit } from '../enums/NoticePeriodUnit';
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
    public readonly accountType?: AccountType,
    public readonly hasCashFlows: boolean = true,
    public readonly noticePeriodValue?: number,
    public readonly noticePeriodUnit?: NoticePeriodUnit,
    public readonly processingDays?: number,
  ) {}

  get durationYears(): number {
    return this.durationMonths / 12;
  }
}
