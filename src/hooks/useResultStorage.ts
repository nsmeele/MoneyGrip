import { useState, useCallback } from 'react';
import { BankAccount } from '../models/BankAccount';
import type { ExportedResult, StoredResult } from '../models/ExportFile';
import { toStoredResult } from '../transfer/dataSerializer';
import { BankAccountInput } from '../models/BankAccountInput';
import { AccountCalculator } from '../calculator/AccountCalculator';
import { DayCountConvention } from '../enums/DayCountConvention';
import { daysBetween, todayISO } from '../utils/date';

const STORAGE_KEY = 'bank-account-results';

const calc = new AccountCalculator();

function recalculate(item: ExportedResult, ongoingDuration?: number): BankAccount {
  const cashFlows = item.cashFlows ?? [];
  const isOngoing = item.isOngoing ?? false;
  const dayCount = item.dayCount ?? DayCountConvention.NOM_12;
  const rateChanges = item.rateChanges ?? [];
  const isVariableRate = item.isVariableRate ?? rateChanges.length > 0;

  const durationMonths = isOngoing && item.startDate
    ? (ongoingDuration ?? Math.max(1, Math.ceil(daysBetween(item.startDate, todayISO()) / 30.44) + 12))
    : item.durationMonths;

  const input = new BankAccountInput(
    item.startAmount, item.annualInterestRate, durationMonths,
    item.interval, item.interestType, item.startDate, cashFlows, isOngoing, dayCount, rateChanges, isVariableRate,
    item.currency, item.accountType, item.hasCashFlows ?? true,
    item.noticePeriodValue, item.noticePeriodUnit, item.processingDays,
  );
  const result = calc.calculate(input);

  Object.assign(result, { id: item.id, timestamp: item.timestamp });
  return result;
}

function restoreFromStorage(item: StoredResult, ongoingDuration?: number): BankAccount {
  const cashFlows = item.cashFlows ?? [];
  const isOngoing = item.isOngoing ?? false;
  const dayCount = item.dayCount ?? DayCountConvention.NOM_12;
  const rateChanges = item.rateChanges ?? [];
  const isVariableRate = item.isVariableRate ?? rateChanges.length > 0;

  const durationMonths = isOngoing && item.startDate
    ? (ongoingDuration ?? Math.max(1, Math.ceil(daysBetween(item.startDate, todayISO()) / 30.44) + 12))
    : item.durationMonths;

  const shouldRecalculate = (isOngoing && item.startDate)
    || (cashFlows.length > 0 && item.startDate)
    || (rateChanges.length > 0 && item.startDate)
    || (import.meta.env.DEV && item.startDate);

  if (shouldRecalculate) {
    return recalculate(item, ongoingDuration);
  }

  const result = new BankAccount(
    item.startAmount, item.annualInterestRate, durationMonths,
    item.interval, item.interestType, item.startDate, item.periods ?? [],
    cashFlows, isOngoing, dayCount, rateChanges, isVariableRate,
    item.currency, item.accountType, item.hasCashFlows ?? true,
    item.noticePeriodValue, item.noticePeriodUnit, item.processingDays,
  );

  Object.assign(result, { id: item.id, timestamp: item.timestamp });
  return result;
}

function loadFromStorage(): BankAccount[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed: StoredResult[] = JSON.parse(data);
    const results = parsed.map((item) => restoreFromStorage(item));

    // Find the last month across all projections
    let maxKey = '';
    for (const r of results) {
      for (const key of r.calendarMonthProjection.keys()) {
        if (key > maxKey) maxKey = key;
      }
    }

    // Re-reconstruct ongoing accounts that don't reach that far
    if (maxKey) {
      return results.map((r, i) => {
        if (!r.isOngoing || !r.startDate) return r;
        const lastKey = [...r.calendarMonthProjection.keys()].sort().pop();
        if (lastKey && lastKey >= maxKey) return r;
        const months = Math.max(1, Math.ceil(daysBetween(r.startDate, `${maxKey}-28`) / 30.44));
        return restoreFromStorage(parsed[i], months);
      });
    }

    return results;
  } catch {
    return [];
  }
}

function saveToStorage(results: BankAccount[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(results.map(toStoredResult)));
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
    const reconstructed = incoming.map((item) => recalculate(item));
    saveToStorage(reconstructed);
    setResults(reconstructed);
  }, []);

  const mergeResults = useCallback((incoming: ExportedResult[]) => {
    setResults((prev) => {
      const existingIds = new Set(prev.map((r) => r.id));
      const newItems = incoming.filter((r) => !existingIds.has(r.id)).map((item) => recalculate(item));
      const merged = [...prev, ...newItems];
      saveToStorage(merged);
      return merged;
    });
  }, []);

  return { results, addResult, updateResult, removeResult, clearResults, replaceResults, mergeResults };
}
