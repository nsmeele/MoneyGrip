import type { BankAccount } from '../models/BankAccount';
import { BankAccountInput } from '../models/BankAccountInput';
import { AccountCalculator } from '../calculator/AccountCalculator';
import { monthsBetween } from './date';

const calculator = new AccountCalculator();

/**
 * For ongoing accounts, recalculate with enough periods to cover through endYear.
 * Returns the original account if no extension is needed.
 */
export function extendOngoingAccount(account: BankAccount, endYear: number): BankAccount {
  if (!account.isOngoing || !account.startDate) return account;

  const needed = monthsBetween(account.startDate, `${endYear + 1}-01-01`);
  if (needed <= account.durationMonths) return account;

  const input = new BankAccountInput(
    account.startAmount, account.annualInterestRate, needed,
    account.interval, account.interestType, account.startDate,
    account.cashFlows, account.isOngoing, account.dayCount,
    account.rateChanges, account.isVariableRate, account.currency,
    account.accountType, account.hasCashFlows,
  );
  const extended = calculator.calculate(input);
  // Preserve identity from the original account
  Object.defineProperty(extended, 'id', { value: account.id });
  Object.defineProperty(extended, 'timestamp', { value: account.timestamp });
  return extended;
}
