import { useState, useCallback } from 'react';
import { InterestCalculationResult } from '../models/InterestCalculationResult';
import type { PeriodResult } from '../models/InterestCalculationResult';
import type { PayoutInterval } from '../enums/PayoutInterval';
import type { RenteType } from '../enums/RenteType';

const STORAGE_KEY = 'interest-calculator-results';

interface StoredResult {
  id: string;
  timestamp: number;
  startBedrag: number;
  jaarRentePercentage: number;
  looptijdMaanden: number;
  interval: PayoutInterval;
  renteType: RenteType;
  startDatum?: string;
  perioden: PeriodResult[];
}

function loadFromStorage(): InterestCalculationResult[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    const parsed: StoredResult[] = JSON.parse(data);
    return parsed.map((item) => {
      const result = new InterestCalculationResult(
        item.startBedrag,
        item.jaarRentePercentage,
        item.looptijdMaanden,
        item.interval,
        item.renteType,
        item.startDatum,
        item.perioden,
      );
      Object.assign(result, { id: item.id, timestamp: item.timestamp });
      return result;
    });
  } catch {
    return [];
  }
}

function saveToStorage(results: InterestCalculationResult[]): void {
  const data: StoredResult[] = results.map((r) => ({
    id: r.id,
    timestamp: r.timestamp,
    startBedrag: r.startBedrag,
    jaarRentePercentage: r.jaarRentePercentage,
    looptijdMaanden: r.looptijdMaanden,
    interval: r.interval,
    renteType: r.renteType,
    startDatum: r.startDatum,
    perioden: r.perioden,
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useResultStorage() {
  const [results, setResults] = useState<InterestCalculationResult[]>(loadFromStorage);

  const addResult = useCallback((result: InterestCalculationResult) => {
    setResults((prev) => {
      const updated = [result, ...prev];
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const updateResult = useCallback((id: string, result: InterestCalculationResult) => {
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

  return { results, addResult, updateResult, removeResult, clearResults };
}
