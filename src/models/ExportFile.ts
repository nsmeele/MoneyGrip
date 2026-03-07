import type { PayoutInterval } from '../enums/PayoutInterval';
import type { InterestType } from '../enums/InterestType';
import type { DayCountConvention } from '../enums/DayCountConvention';
import type { PeriodResult } from './BankAccount';
import type { CashFlow } from './CashFlow';
import type { RateChange } from './RateChange';

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
  periods: PeriodResult[];
  cashFlows?: CashFlow[];
  isOngoing?: boolean;
  dayCount?: DayCountConvention;
  rateChanges?: RateChange[];
  isVariableRate?: boolean;
  currency?: string;
}

export interface ExportFile {
  version: number;
  exportedAt: string;
  results: ExportedResult[];
  portfolioIds: string[];
}
