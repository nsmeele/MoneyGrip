import { useState, useCallback } from 'react';
import type { MoneyTransfer } from '../models/MoneyTransfer';

const STORAGE_KEY = 'money-transfers';

function loadFromStorage(): MoneyTransfer[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveToStorage(transfers: MoneyTransfer[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transfers));
}

export function useTransferStorage() {
  const [transfers, setTransfers] = useState<MoneyTransfer[]>(loadFromStorage);

  const addTransfer = useCallback((transfer: MoneyTransfer) => {
    setTransfers((prev) => {
      const updated = [transfer, ...prev];
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const replaceTransfer = useCallback((id: string, transfer: MoneyTransfer) => {
    setTransfers((prev) => {
      const updated = prev.map((t) => t.id === id ? transfer : t);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const removeTransfer = useCallback((id: string) => {
    setTransfers((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const clearTransfers = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setTransfers([]);
  }, []);

  const replaceTransfers = useCallback((incoming: MoneyTransfer[]) => {
    saveToStorage(incoming);
    setTransfers(incoming);
  }, []);

  const mergeTransfers = useCallback((incoming: MoneyTransfer[]) => {
    setTransfers((prev) => {
      const existingIds = new Set(prev.map((t) => t.id));
      const newItems = incoming.filter((t) => !existingIds.has(t.id));
      const merged = [...prev, ...newItems];
      saveToStorage(merged);
      return merged;
    });
  }, []);

  return { transfers, addTransfer, replaceTransfer, removeTransfer, clearTransfers, replaceTransfers, mergeTransfers };
}
