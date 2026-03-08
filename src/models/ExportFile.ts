import type { PayoutInterval } from '../enums/PayoutInterval';
import type { InterestType } from '../enums/InterestType';
import type { DayCountConvention } from '../enums/DayCountConvention';
import type { AccountType } from '../enums/AccountType';
import type { NoticePeriodUnit } from '../enums/NoticePeriodUnit';
import type { PeriodResult } from './BankAccount';
import type { CashFlow } from './CashFlow';
import type { RateChange } from './RateChange';
import type { MoneyTransfer } from './MoneyTransfer';

export const EXPORT_FORMAT_VERSION = 1;

export interface ExportedResult {
  id: string;
  timestamp: number;
  startAmount: number;
  annualInterestRate: number;
  durationMonths: number;
  interval: PayoutInterval;
  interestType: InterestType;
  startDate?: string;
  cashFlows?: CashFlow[];
  isOngoing?: boolean;
  dayCount?: DayCountConvention;
  rateChanges?: RateChange[];
  isVariableRate?: boolean;
  currency?: string;
  accountType?: AccountType;
  hasCashFlows?: boolean;
  noticePeriodValue?: number;
  noticePeriodUnit?: NoticePeriodUnit;
  processingDays?: number;
}

export interface StoredResult extends ExportedResult {
  periods: PeriodResult[];
}

export interface ExportFile {
  version: number;
  exportedAt: string;
  results: ExportedResult[];
  portfolioIds: string[];
  transfers?: MoneyTransfer[];
}
