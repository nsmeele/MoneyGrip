import { useEffect, useRef, useCallback } from 'react';
import { TabTracker } from '../utils/tabTracker';

const CHANNEL_NAME = 'moneygrip-tab-sync';
const CLEAR_PENDING_KEY = 'moneygrip-clear-pending';

interface UseLastTabClearOptions {
  hasData: boolean;
  clearResults: () => void;
  clearPortfolio: () => void;
}

export function useLastTabClear({ hasData, clearResults, clearPortfolio }: UseLastTabClearOptions) {
  const hasDataRef = useRef(hasData);

  useEffect(() => {
    hasDataRef.current = hasData;
  }, [hasData]);

  useEffect(() => {
    const tracker = new TabTracker(CHANNEL_NAME);

    // Check if a previous last-tab close flagged pending clear.
    // Use PerformanceNavigationTiming to distinguish refresh from new/restored tab:
    // - 'reload' = refresh → remove flag, keep data
    // - anything else (navigate, back_forward) = new or restored tab → clear
    const isPending = localStorage.getItem(CLEAR_PENDING_KEY);

    if (isPending) {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      const isReload = navEntry?.type === 'reload';

      if (isReload) {
        localStorage.removeItem(CLEAR_PENDING_KEY);
      } else {
        localStorage.clear();
        clearResults();
        clearPortfolio();
      }
    }

    function handlePageHide(event: PageTransitionEvent) {
      if (!event.persisted && tracker.isLastTab() && hasDataRef.current) {
        localStorage.setItem(CLEAR_PENDING_KEY, '1');
      }
    }

    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      tracker.destroy();
    };
  }, [clearResults, clearPortfolio]);

  const clearAllData = useCallback(() => {
    localStorage.clear();
    clearResults();
    clearPortfolio();
  }, [clearResults, clearPortfolio]);

  return { clearAllData };
}
