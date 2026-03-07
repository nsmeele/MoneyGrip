import { createContext } from 'react';
import type { ImportPreview, ImportMode } from '../hooks/useDataTransfer';
import type { BankAccount } from '../models/BankAccount';

export type ModalState =
  | { type: 'import'; preview: ImportPreview; onConfirm: (mode: ImportMode) => void; onCancel?: () => void }
  | { type: 'export'; resultCount: number; onConfirm: () => void }
  | { type: 'account'; editingResult: BankAccount | null; onResult: (result: BankAccount) => void }
  | { type: 'confirm'; title: string; message: string; confirmLabel: string; onConfirm: () => void }
  | null;

export interface ModalContextValue {
  openModal: (modal: NonNullable<ModalState>) => void;
  closeModal: () => void;
}

export const ModalContext = createContext<ModalContextValue | null>(null);
