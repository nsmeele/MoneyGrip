import { createContext } from 'react';
import type { MoneyTransfer } from '../models/MoneyTransfer';

export interface TransferContextValue {
  transfers: MoneyTransfer[];
  createTransfer: (params: CreateTransferParams) => void;
  updateTransfer: (oldTransferId: string, params: CreateTransferParams) => void;
  deleteTransfer: (id: string) => void;
  getTransfersForAccount: (accountId: string) => MoneyTransfer[];
  clearTransfers: () => void;
  replaceTransfers: (incoming: MoneyTransfer[]) => void;
  mergeTransfers: (incoming: MoneyTransfer[]) => void;
}

export interface CreateTransferParams {
  sourceAccountId: string;
  targetAccountId: string;
  amount: number;
  initiationDate: string;
  description: string;
}

export const TransferContext = createContext<TransferContextValue | null>(null);
