import { useState, useCallback } from 'react';
import { BankAccount } from '../models/BankAccount';
import type { ExportedResult } from '../models/ExportFile';
import { toExportedResult } from '../transfer/dataSerializer';
import { BankAccountInput } from '../models/BankAccountInput';
import { AccountCalculator } from '../calculator/AccountCalculator';
import { monthsBetween, todayISO } from '../utils/date';

const STORAGE_KEY = 'bank-account-results';

const calc = new AccountCalculator();

function reconstructResult(item: ExportedResult): BankAccount {
  const cashFlows = item.cashFlows ?? [];
  const isOngoing = item.isOngoing ?? false;
  let result: BankAccount;

  const durationMonths = isOngoing && item.startDate
    ? Math.max(1, monthsBetween(item.startDate, todayISO()))
    : item.durationMonths;

  if ((cashFlows.length > 0 && item.startDate) || (isOngoing && item.startDate)) {
    const input = new BankAccountInput(
      item.startAmount, item.annualInterestRate, durationMonths,
      item.interval, item.interestType, item.startDate, cashFlows, isOngoing,
    );
    result = calc.calculate(input);
  } else {
    result = new BankAccount(
      item.startAmount, item.annualInterestRate, durationMonths,
      item.interval, item.interestType, item.startDate, item.periods,
      cashFlows, isOngoing,
    );
  }

  Object.assign(result, { id: item.id, timestamp: item.timestamp });
  return result;
}

function loadFromStorage(): BankAccount[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed: ExportedResult[] = JSON.parse(data);
    return parsed.map(reconstructResult);
  } catch {
    return [];
  }
}

function saveToStorage(results: BankAccount[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(results.map(toExportedResult)));
}

export function useResultStorage() {
  const [results, setResults] = useState<BankAccount[]>(loadFromStorage);

  const addResult = useCallback((result: BankAccount) => {
    setResults((prev) => {
      const updated = [result, ...prev];
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const updateResult = useCallback((id: string, result: BankAccount) => {
    setResults((prev) => {
      const updated = prev.map((r) => {
        if (r.id !== id) return r;
        Object.assign(result, { id: r.id, timestamp: r.timestamp });
        return result;
      });
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const removeResult = useCallback((id: string) => {
    setResults((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const clearResults = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setResults([]);
  }, []);

  const replaceResults = useCallback((incoming: ExportedResult[]) => {
    const reconstructed = incoming.map(reconstructResult);
    saveToStorage(reconstructed);
    setResults(reconstructed);
  }, []);

  const mergeResults = useCallback((incoming: ExportedResult[]) => {
    setResults((prev) => {
      const existingIds = new Set(prev.map((r) => r.id));
      const newItems = incoming.filter((r) => !existingIds.has(r.id)).map(reconstructResult);
      const merged = [...prev, ...newItems];
      saveToStorage(merged);
      return merged;
    });
  }, []);

  return { results, addResult, updateResult, removeResult, clearResults, replaceResults, mergeResults };
}
