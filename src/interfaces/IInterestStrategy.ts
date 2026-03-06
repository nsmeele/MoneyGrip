import type { BankAccountInput } from '../models/BankAccountInput';
import type { PeriodResult } from '../models/BankAccount';

export interface BalanceAdjustments {
  [periodIndex: number]: number;
}

export interface PeriodScheduleEntry {
  label: string;
  startDate: string;
  endDate: string;
}

export interface IInterestStrategy {
  calculate(input: BankAccountInput, adjustments?: BalanceAdjustments, schedule?: PeriodScheduleEntry[]): PeriodResult[];
}
