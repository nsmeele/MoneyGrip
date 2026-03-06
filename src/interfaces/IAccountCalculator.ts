import type { BankAccountInput } from '../models/BankAccountInput';
import type { BankAccount } from '../models/BankAccount';

export interface IAccountCalculator {
  calculate(input: BankAccountInput): BankAccount;
}
