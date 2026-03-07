import { useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { AccountStoreContext } from './accountStoreContextValue';
import { useResultStorage } from '../hooks/useResultStorage';
import { usePortfolio } from '../hooks/usePortfolio';
import { AccountCalculator } from '../calculator/AccountCalculator';
import { BankAccountInput } from '../models/BankAccountInput';
import type { CashFlow } from '../models/CashFlow';
import type { RateChange } from '../models/RateChange';

export function AccountStoreProvider({ children }: { children: ReactNode }) {
  const {
    results, addResult, updateResult, removeResult,
    clearResults, replaceResults, mergeResults,
  } = useResultStorage();

  const {
    portfolioIds, togglePortfolio, clearPortfolio,
    replacePortfolio, mergePortfolio,
  } = usePortfolio();

  const handleUpdateCashFlows = useCallback((id: string, cashFlows: CashFlow[]) => {
    const existing = results.find((r) => r.id === id);
    if (!existing) return;

    const calc = new AccountCalculator();
    const input = new BankAccountInput(
      existing.startAmount, existing.annualInterestRate, existing.durationMonths,
      existing.interval, existing.interestType, existing.startDate,
      cashFlows, existing.isOngoing, existing.dayCount,
      existing.rateChanges, existing.isVariableRate, existing.currency,
    );
    updateResult(id, calc.calculate(input));
  }, [results, updateResult]);

  const handleUpdateRateChanges = useCallback((id: string, rateChanges: RateChange[]) => {
    const existing = results.find((r) => r.id === id);
    if (!existing) return;

    const calc = new AccountCalculator();
    const input = new BankAccountInput(
      existing.startAmount, existing.annualInterestRate, existing.durationMonths,
      existing.interval, existing.interestType, existing.startDate,
      existing.cashFlows, existing.isOngoing, existing.dayCount,
      rateChanges, existing.isVariableRate, existing.currency,
    );
    updateResult(id, calc.calculate(input));
  }, [results, updateResult]);

  const value = useMemo(() => ({
    results, addResult, updateResult, removeResult,
    clearResults, replaceResults, mergeResults,
    portfolioIds, togglePortfolio, clearPortfolio,
    replacePortfolio, mergePortfolio,
    handleUpdateCashFlows, handleUpdateRateChanges,
  }), [
    results, addResult, updateResult, removeResult,
    clearResults, replaceResults, mergeResults,
    portfolioIds, togglePortfolio, clearPortfolio,
    replacePortfolio, mergePortfolio,
    handleUpdateCashFlows, handleUpdateRateChanges,
  ]);

  return (
    <AccountStoreContext.Provider value={value}>
      {children}
    </AccountStoreContext.Provider>
  );
}
