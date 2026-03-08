import { useContext } from 'react';
import { TransferContext, type TransferContextValue } from './transferContextValue';

export function useTransfer(): TransferContextValue {
  const ctx = useContext(TransferContext);
  if (!ctx) throw new Error('useTransfer must be used within TransferProvider');
  return ctx;
}
