import { useState, useCallback } from 'react';

const STORAGE_KEY = 'interest-calculator-portfolio';

function loadPortfolio(): Set<string> {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return new Set();
    return new Set(JSON.parse(data));
  } catch {
    return new Set();
  }
}

function savePortfolio(ids: Set<string>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export function usePortfolio() {
  const [portfolioIds, setPortfolioIds] = useState<Set<string>>(loadPortfolio);

  const togglePortfolio = useCallback((id: string) => {
    setPortfolioIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      savePortfolio(next);
      return next;
    });
  }, []);

  const clearPortfolio = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setPortfolioIds(new Set());
  }, []);

  return { portfolioIds, togglePortfolio, clearPortfolio };
}
