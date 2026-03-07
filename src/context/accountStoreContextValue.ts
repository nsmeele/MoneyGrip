import { createContext } from 'react';
import type { BankAccount } from '../models/BankAccount';
import type { ExportedResult } from '../models/ExportFile';
import type { CashFlow } from '../models/CashFlow';
import type { RateChange } from '../models/RateChange';

export interface AccountStoreContextValue {
  results: BankAccount[];
  addResult: (r: BankAccount) => void;
  updateResult: (id: string, r: BankAccount) => void;
  removeResult: (id: string) => void;
  clearResults: () => void;
  replaceResults: (incoming: ExportedResult[]) => void;
  mergeResults: (incoming: ExportedResult[]) => void;
  portfolioIds: Set<string>;
  togglePortfolio: (id: string) => void;
  clearPortfolio: () => void;
  replacePortfolio: (ids: string[]) => void;
  mergePortfolio: (ids: string[]) => void;
  handleUpdateCashFlows: (id: string, cashFlows: CashFlow[]) => void;
  handleUpdateRateChanges: (id: string, rateChanges: RateChange[]) => void;
}

export const AccountStoreContext = createContext<AccountStoreContextValue | null>(null);
